-- First, fix the infinite recursion issue with a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a new policy using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  public.get_current_user_role() = 'admin'
);

-- Create a simple admin profile directly (since we can't create auth users via SQL)
-- We'll use a known UUID for this admin user
DO $$
BEGIN
  -- Insert admin profile with a specific UUID that we'll use for testing
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    role
  ) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'admin@homebrew.com',
    'Admin User',
    'admin'
  ) ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
END $$;