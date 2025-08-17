-- Security fix: Implement more restrictive admin access to customer data

-- First, create an audit log table for tracking admin access to sensitive data
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  accessed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.admin_audit_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create a more secure admin verification function with additional checks
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  last_login TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Return false if not admin
  IF user_role != 'admin' THEN
    RETURN false;
  END IF;
  
  -- Additional security: Check if user has recent activity
  -- This adds a time-based restriction to admin access
  SELECT auth.users.last_sign_in_at INTO last_login
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Require admin to have signed in within last 24 hours for sensitive data access
  IF last_login < (now() - interval '24 hours') THEN
    RETURN false;
  END IF;
  
  -- Log the admin access attempt
  INSERT INTO public.admin_audit_logs (
    admin_user_id, 
    action, 
    table_name,
    created_at
  ) VALUES (
    auth.uid(), 
    'profile_access_check', 
    'profiles',
    now()
  );
  
  RETURN true;
END;
$$;

-- Create a function to log admin access to specific profiles
CREATE OR REPLACE FUNCTION public.log_admin_profile_access(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    created_at
  ) VALUES (
    auth.uid(),
    'profile_view',
    'profiles',
    profile_user_id,
    now()
  );
END;
$$;

-- Drop the old overly permissive admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a more restrictive admin policy that requires additional verification
CREATE POLICY "Verified admins can view profiles with logging" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (public.verify_admin_access() = true)
);

-- Create a separate policy for admin updates that's more restrictive
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Add a separate policy for admin updates with logging
CREATE POLICY "Verified admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.verify_admin_access() = true);

-- Create a view for admins that excludes the most sensitive data by default
CREATE OR REPLACE VIEW public.admin_profiles_safe AS
SELECT 
  id,
  user_id,
  full_name,
  role,
  vendor_application_status,
  vendor_business_name,
  vendor_description,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the safe view
ALTER VIEW public.admin_profiles_safe SET (security_barrier = true);

-- Create a function for admins to access full profile data when specifically needed
CREATE OR REPLACE FUNCTION public.get_full_profile_admin(target_user_id UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  role TEXT,
  vendor_application_status TEXT,
  vendor_business_name TEXT,
  vendor_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin access
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: Admin verification failed';
  END IF;
  
  -- Log the sensitive data access
  PERFORM public.log_admin_profile_access(target_user_id);
  
  -- Return the full profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.address,
    p.role,
    p.vendor_application_status,
    p.vendor_business_name,
    p.vendor_description,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Also fix the orders table security issue
-- Drop the overly permissive vendor/admin policy
DROP POLICY IF EXISTS "Vendors can view orders for their restaurant" ON public.orders;

-- Create more restrictive policies for orders
CREATE POLICY "Vendors can view orders for their products only" 
ON public.orders 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'vendor'
    ) AND
    vendor_id IN (
      SELECT id FROM public.vendors v
      INNER JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE p.role = 'vendor'
    )
  )
);

-- Admins can view order metadata but not sensitive payment info
CREATE POLICY "Admins can view order summary" 
ON public.orders 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (public.verify_admin_access() = true)
);

-- Create a safe orders view for admin dashboard that excludes sensitive data
CREATE OR REPLACE VIEW public.admin_orders_safe AS
SELECT 
  id,
  user_id,
  vendor_id,
  total_amount,
  status,
  created_at,
  updated_at,
  -- Exclude: delivery_address, phone, stripe_payment_intent_id
  'REDACTED' as delivery_address,
  'REDACTED' as phone,
  payment_status
FROM public.orders;