-- Fix critical security vulnerability: Vendors can access all customer data
-- Add vendor_id to profiles to properly link vendors to their restaurant

-- 1. Add vendor_id column to profiles table to link approved vendors to their vendor entry
ALTER TABLE public.profiles ADD COLUMN vendor_id uuid REFERENCES public.vendors(id);

-- 2. Update the vendor approval trigger to link the profile to the created vendor
CREATE OR REPLACE FUNCTION public.handle_vendor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_vendor_id uuid;
BEGIN
  -- When a vendor is approved in profiles, create vendor entry and link it
  IF NEW.vendor_application_status = 'approved' AND OLD.vendor_application_status = 'pending' THEN
    INSERT INTO public.vendors (name, description, category, is_active, approval_status)
    VALUES (
      NEW.vendor_business_name,
      NEW.vendor_description,
      'restaurant',
      true,
      'approved'
    )
    RETURNING id INTO new_vendor_id;
    
    -- Link the profile to the created vendor
    NEW.vendor_id := new_vendor_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Drop the existing vulnerable vendor policies for orders
DROP POLICY IF EXISTS "Vendors can view orders for their restaurant" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update orders for their restaurant" ON public.orders;

-- 4. Create secure vendor policies that only allow access to their own restaurant's orders
CREATE POLICY "Vendors can view their own restaurant orders only"
ON public.orders
FOR SELECT
USING (
  vendor_id IN (
    SELECT p.vendor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.vendor_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Vendors can update their own restaurant orders only"
ON public.orders
FOR UPDATE
USING (
  vendor_id IN (
    SELECT p.vendor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.vendor_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 5. Update order_items policies to match the new vendor restrictions
DROP POLICY IF EXISTS "Vendors can view order items for their orders" ON public.order_items;

CREATE POLICY "Vendors can view order items for their own restaurant orders only"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.profiles p ON p.vendor_id = o.vendor_id
    WHERE o.id = order_items.order_id
    AND p.user_id = auth.uid()
    AND p.vendor_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 6. Update products policies to ensure vendors can only manage their own products
DROP POLICY IF EXISTS "Products can be managed by vendor owners or admins" ON public.products;

CREATE POLICY "Vendors can manage their own restaurant products only"
ON public.products
FOR ALL
USING (
  vendor_id IN (
    SELECT p.vendor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.vendor_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 7. Update vendors policies to restrict vendor access to their own restaurant
DROP POLICY IF EXISTS "Vendors can be managed by admins" ON public.vendors;

CREATE POLICY "Vendors are viewable by everyone"
ON public.vendors
FOR SELECT
USING (true);

CREATE POLICY "Vendors can update their own restaurant only"
ON public.vendors
FOR UPDATE
USING (
  id IN (
    SELECT p.vendor_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.vendor_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can create and delete vendors"
ON public.vendors
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- 8. For existing approved vendors, link them to their vendor entries
-- This is a one-time data migration to fix existing data
UPDATE public.profiles 
SET vendor_id = v.id
FROM public.vendors v
WHERE profiles.vendor_application_status = 'approved'
AND profiles.vendor_business_name = v.name
AND profiles.vendor_id IS NULL;