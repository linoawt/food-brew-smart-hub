-- Create test admin user if it doesn't exist
DO $$
BEGIN
  -- Insert admin user into profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@homebrew.com') THEN
    -- First create a dummy auth user entry simulation in profiles
    INSERT INTO profiles (
      user_id, 
      email, 
      full_name, 
      role,
      created_at,
      updated_at
    ) VALUES (
      'f34a8bcc-400c-449c-b245-cb9bf5edf913'::uuid,
      'admin@homebrew.com',
      'Admin User',
      'admin',
      now(),
      now()
    );
    
    RAISE NOTICE 'Admin user profile created for testing';
  END IF;
END
$$;