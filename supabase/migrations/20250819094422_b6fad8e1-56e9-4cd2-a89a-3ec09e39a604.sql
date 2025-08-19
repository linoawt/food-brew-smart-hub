-- Fix critical security vulnerability by first adding vendor_id to profiles, then fixing RLS policies

-- Step 1: Add vendor_id column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id);

-- Step 2: Update the handle_vendor_approval trigger to link profiles to vendors
CREATE OR REPLACE FUNCTION public.handle_vendor_approval()
RETURNS TRIGGER AS $$
DECLARE
    new_vendor_id UUID;
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
        ) RETURNING id INTO new_vendor_id;
        
        -- Link the profile to the new vendor
        NEW.vendor_id = new_vendor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: One-time migration to link existing approved vendors to their entries
UPDATE public.profiles 
SET vendor_id = (
    SELECT v.id 
    FROM public.vendors v 
    WHERE v.name = profiles.vendor_business_name 
    AND profiles.vendor_application_status = 'approved'
    LIMIT 1
)
WHERE vendor_application_status = 'approved' 
AND vendor_id IS NULL;

-- Step 4: Fix the critical security vulnerability in orders RLS policies
DROP POLICY IF EXISTS "Vendors can view orders for their restaurant" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update orders for their restaurant" ON public.orders;

-- Create secure policy for vendors to only see orders for their specific vendor_id
CREATE POLICY "Vendors can view orders for their own restaurant only" 
ON public.orders 
FOR SELECT 
USING (
    vendor_id IN (
        SELECT vendor_id 
        FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'vendor' AND vendor_id IS NOT NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    user_id = auth.uid()
);

-- Create secure policy for vendors to only update orders for their specific vendor_id
CREATE POLICY "Vendors can update orders for their own restaurant only" 
ON public.orders 
FOR UPDATE 
USING (
    vendor_id IN (
        SELECT vendor_id 
        FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'vendor' AND vendor_id IS NOT NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Step 5: Fix order_items policies for consistency
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
        AND p.role = 'vendor'
        AND p.vendor_id IS NOT NULL
    )
    OR
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);