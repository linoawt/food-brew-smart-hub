-- Fix the infinite recursion in profiles table RLS policies
-- Drop the problematic policy first
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a better admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  auth.uid() IN (
    SELECT user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    AND user_id = auth.uid()
  )
);

-- Also create an admin user for testing
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@homebrew.com',
  crypt('AdminPass123!', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create admin profile (this will be handled by the trigger)
-- But let's also manually ensure the admin role is set
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@homebrew.com';
    
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (user_id, email, full_name, role)
        VALUES (admin_user_id, 'admin@homebrew.com', 'Admin User', 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin';
    END IF;
END $$;