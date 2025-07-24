-- Add approval status to vendors table
ALTER TABLE public.vendors ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create categories table for dynamic category management
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Categories can be managed by admins" 
ON public.categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Add vendor registration status field to profiles
ALTER TABLE public.profiles ADD COLUMN vendor_application_status TEXT DEFAULT NULL CHECK (vendor_application_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN vendor_business_name TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN vendor_description TEXT DEFAULT NULL;

-- Create vendor registration approvals trigger
CREATE OR REPLACE FUNCTION public.handle_vendor_approval()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_vendor_approval
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vendor_approval();

-- Update existing vendors to have approved status
UPDATE public.vendors SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Add updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
('Restaurant', 'Full-service restaurants and cafes'),
('Fast Food', 'Quick service restaurants'),
('Brewery', 'Breweries and beer houses'),
('Bakery', 'Bakeries and pastry shops'),
('Coffee Shop', 'Coffee shops and tea houses'),
('Food Truck', 'Mobile food vendors')
ON CONFLICT (name) DO NOTHING;