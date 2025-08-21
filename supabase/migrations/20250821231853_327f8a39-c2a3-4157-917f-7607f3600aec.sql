-- Enhanced security for profiles table and admin access (fixed)

-- Create a more robust admin verification function with additional security checks
CREATE OR REPLACE FUNCTION public.verify_admin_access_enhanced()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
  profile_exists BOOLEAN;
  session_valid BOOLEAN;
  last_admin_login TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    INSERT INTO public.admin_audit_logs (admin_user_id, action, table_name, accessed_data, created_at)
    VALUES (NULL, 'unauthorized_admin_access_attempt', 'profiles', '{"error": "no_auth_user"}', now());
    RETURN false;
  END IF;
  
  -- Get user role and verify profile exists
  SELECT role INTO user_role
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  profile_exists := FOUND;
  
  -- Enhanced validation: profile must exist and role must be admin
  IF NOT profile_exists OR user_role IS NULL OR user_role != 'admin' THEN
    INSERT INTO public.admin_audit_logs (admin_user_id, action, table_name, accessed_data, created_at)
    VALUES (auth.uid(), 'failed_admin_verification', 'profiles', 
            jsonb_build_object('reason', 'invalid_role_or_profile', 'role', user_role, 'profile_exists', profile_exists), 
            now());
    RETURN false;
  END IF;
  
  -- Additional session validation - check if user has recent admin activity
  SELECT created_at INTO last_admin_login
  FROM public.admin_audit_logs
  WHERE admin_user_id = auth.uid() 
    AND action = 'admin_login_success'
    AND created_at > (now() - INTERVAL '24 hours')
  ORDER BY created_at DESC
  LIMIT 1;
  
  session_valid := FOUND AND last_admin_login > (now() - INTERVAL '24 hours');
  
  -- Log successful admin access verification
  INSERT INTO public.admin_audit_logs (
    admin_user_id, 
    action, 
    table_name,
    accessed_data,
    created_at
  ) VALUES (
    auth.uid(), 
    'admin_access_verified', 
    'profiles',
    jsonb_build_object('session_valid', session_valid, 'verification_time', now()),
    now()
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the exception for security monitoring
    INSERT INTO public.admin_audit_logs (admin_user_id, action, table_name, accessed_data, created_at)
    VALUES (auth.uid(), 'admin_verification_exception', 'profiles', 
            jsonb_build_object('error', SQLERRM), now());
    RETURN false;
END;
$$;

-- Create a function for accessing sensitive profile data with enhanced logging
CREATE OR REPLACE FUNCTION public.get_profile_sensitive_data(target_user_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  full_name text, 
  email text, 
  phone text, 
  address text, 
  role text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Enhanced admin verification
  IF NOT public.verify_admin_access_enhanced() THEN
    RAISE EXCEPTION 'Access denied: Enhanced admin verification failed';
  END IF;
  
  -- Log sensitive data access with specific user being accessed
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    accessed_data,
    created_at
  ) VALUES (
    auth.uid(),
    'sensitive_profile_access',
    'profiles',
    target_user_id,
    jsonb_build_object(
      'accessed_user_id', target_user_id,
      'data_type', 'full_profile_with_pii',
      'access_timestamp', now()
    ),
    now()
  );
  
  -- Return the sensitive profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.phone,
    p.address,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Create a function for getting masked profile data for general admin use
CREATE OR REPLACE FUNCTION public.get_profile_masked_data(target_user_id uuid)
RETURNS TABLE(
  id uuid, 
  user_id uuid, 
  full_name text, 
  email_masked text, 
  phone_masked text, 
  role text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Use enhanced admin verification
  IF NOT public.verify_admin_access_enhanced() THEN
    RAISE EXCEPTION 'Access denied: Enhanced admin verification failed';
  END IF;
  
  -- Log masked data access
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    record_id,
    accessed_data,
    created_at
  ) VALUES (
    auth.uid(),
    'masked_profile_access',
    'profiles',
    target_user_id,
    jsonb_build_object(
      'accessed_user_id', target_user_id,
      'data_type', 'masked_profile',
      'access_timestamp', now()
    ),
    now()
  );
  
  -- Return masked profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    CASE 
      WHEN p.email IS NOT NULL THEN 
        substring(p.email from 1 for 2) || '***@' || split_part(p.email, '@', 2)
      ELSE NULL 
    END as email_masked,
    CASE 
      WHEN p.phone IS NOT NULL THEN 
        substring(p.phone from 1 for 3) || '***' || substring(p.phone from length(p.phone) - 1)
      ELSE NULL 
    END as phone_masked,
    p.role,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Create a function to log admin login success for session tracking
CREATE OR REPLACE FUNCTION public.log_admin_login_success()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    accessed_data,
    created_at
  ) VALUES (
    auth.uid(),
    'admin_login_success',
    'auth',
    jsonb_build_object('login_timestamp', now()),
    now()
  );
END;
$$;

-- Update the existing verify_admin_access function to use enhanced version
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN public.verify_admin_access_enhanced();
END;
$$;