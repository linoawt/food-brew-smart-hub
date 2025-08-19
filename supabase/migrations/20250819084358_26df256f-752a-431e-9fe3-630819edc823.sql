-- Fix critical security vulnerability: Restrict vendor access to only their own orders
-- This prevents vendors from accessing other vendors' customer data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Vendors can view orders for their restaurant" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update orders for their restaurant" ON public.orders;

-- Create secure policy for vendors to only see orders for their specific vendor_id
CREATE POLICY "Vendors can view orders for their own restaurant only" 
ON public.orders 
FOR SELECT 
USING (
  vendor_id IN (
    SELECT v.id 
    FROM public.vendors v
    JOIN public.profiles p ON p.vendor_id = v.id
    WHERE p.user_id = auth.uid() AND p.role = 'vendor'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create secure policy for vendors to only update orders for their specific vendor_id
CREATE POLICY "Vendors can update orders for their own restaurant only" 
ON public.orders 
FOR UPDATE 
USING (
  vendor_id IN (
    SELECT v.id 
    FROM public.vendors v
    JOIN public.profiles p ON p.vendor_id = v.id
    WHERE p.user_id = auth.uid() AND p.role = 'vendor'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Also fix order_items policies for consistency
DROP POLICY IF EXISTS "Vendors can view order items for their orders" ON public.order_items;

CREATE POLICY "Vendors can view order items for their own restaurant orders only" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.vendors v ON o.vendor_id = v.id
    JOIN public.profiles p ON p.vendor_id = v.id
    WHERE o.id = order_items.order_id 
    AND p.user_id = auth.uid() 
    AND p.role = 'vendor'
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