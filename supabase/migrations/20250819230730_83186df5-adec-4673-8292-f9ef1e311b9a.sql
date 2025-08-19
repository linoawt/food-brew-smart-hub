-- Critical Security Fix: Update handle_vendor_approval function with proper search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.handle_vendor_approval()
RETURNS TRIGGER AS $$
DECLARE
    new_vendor_id UUID;
BEGIN
    -- When a vendor is approved in profiles, create vendor entry and link it
    IF NEW.vendor_application_status = 'approved' AND OLD.vendor_application_status = 'pending' THEN
        INSERT INTO public.vendors (name, description, category, is_active, approval_status)
        VALUES (
            NEW.vendor_business_name,
            NEW.vendor_description,
            'restaurant',
            true,
            'approved'
        ) RETURNING id INTO new_vendor_id;
        
        -- Link the profile to the new vendor
        NEW.vendor_id = new_vendor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';