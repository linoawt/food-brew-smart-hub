-- Fix security issue: Replace insecure admin_profiles_view with secure function
-- Drop the existing insecure view
DROP VIEW IF EXISTS public.admin_profiles_view;

-- Create a secure function instead of a view for admin profile access
CREATE OR REPLACE FUNCTION public.get_admin_profiles_list()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  email_masked text,
  phone_masked text,
  role text,
  vendor_application_status text,
  vendor_business_name text,
  vendor_description text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enhanced admin verification
  IF NOT public.verify_admin_access_enhanced() THEN
    RAISE EXCEPTION 'Access denied: Admin verification failed';
  END IF;
  
  -- Log admin access to sensitive data
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    accessed_data,
    created_at
  ) VALUES (
    auth.uid(),
    'admin_profiles_list_access',
    'profiles',
    jsonb_build_object('access_type', 'masked_profiles_list', 'timestamp', now()),
    now()
  );
  
  -- Return masked profile data for admin dashboard
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
    p.vendor_application_status,
    p.vendor_business_name,
    p.vendor_description,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;