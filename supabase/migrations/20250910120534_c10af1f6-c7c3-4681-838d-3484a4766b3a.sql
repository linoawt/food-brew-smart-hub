-- Create an admin user for testing
-- First create the auth user with admin email
-- Insert a profile record for admin user (will be linked when admin signs up)

-- Add test admin user data
INSERT INTO public.profiles (
  id,
  user_id, 
  full_name,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'System Administrator',
  'admin@smartportal.com',
  'admin',
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;

-- Note: The actual admin user signup will need to be done through the UI
-- Email: admin@smartportal.com
-- Password: Admin123!@#