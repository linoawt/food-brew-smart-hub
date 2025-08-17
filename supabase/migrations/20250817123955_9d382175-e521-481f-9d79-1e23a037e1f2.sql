-- Fix security linter issues

-- Drop the problematic SECURITY DEFINER view
DROP VIEW IF EXISTS public.admin_profiles_safe;

-- Fix function search paths by setting them explicitly
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
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

-- Fix the log function search path
CREATE OR REPLACE FUNCTION public.log_admin_profile_access(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix the get full profile function search path
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
SET search_path TO 'public'
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

-- Fix the existing function that also had search path issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;