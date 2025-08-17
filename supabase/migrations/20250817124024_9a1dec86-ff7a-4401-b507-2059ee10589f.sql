-- Fix the remaining function search path security warning
CREATE OR REPLACE FUNCTION public.handle_vendor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a vendor is approved in profiles, create vendor entry
  IF NEW.vendor_application_status = 'approved' AND OLD.vendor_application_status = 'pending' THEN
    INSERT INTO public.vendors (name, description, category, is_active, approval_status)
    VALUES (
      NEW.vendor_business_name,
      NEW.vendor_description,
      'restaurant',
      true,
      'approved'
    );
  END IF;
  RETURN NEW;
END;
$$;