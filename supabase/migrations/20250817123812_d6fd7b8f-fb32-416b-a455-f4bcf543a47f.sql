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
  profile_exists BOOLEAN;
BEGIN
  -- Get user role and check if profile exists
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Return false if not admin or profile doesn't exist
  IF user_role != 'admin' OR user_role IS NULL THEN
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
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
EXCEPTION
  WHEN OTHERS THEN
    -- Silent fail for logging to not break main functionality
    NULL;
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

-- Update the existing update policy to be more explicit
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Add a separate policy for admin updates with verification
CREATE POLICY "Verified admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  (public.verify_admin_access() = true)
);

-- Create a view for admins that excludes the most sensitive data by default
CREATE OR REPLACE VIEW public.admin_profiles_safe AS
SELECT 
  profiles.id,
  profiles.user_id,
  profiles.full_name,
  profiles.role,
  profiles.vendor_application_status,
  profiles.vendor_business_name,
  profiles.vendor_description,
  profiles.created_at,
  profiles.updated_at,
  -- Show masked versions of sensitive data
  CASE 
    WHEN profiles.email IS NOT NULL THEN LEFT(profiles.email, 3) || '***@' || SPLIT_PART(profiles.email, '@', 2)
    ELSE NULL
  END as email_masked,
  CASE 
    WHEN profiles.phone IS NOT NULL THEN '***' || RIGHT(profiles.phone, 4)
    ELSE NULL
  END as phone_masked
FROM public.profiles;

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