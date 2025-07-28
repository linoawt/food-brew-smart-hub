-- Create storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);

-- Create policies for food image uploads
CREATE POLICY "Food images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'food-images');

CREATE POLICY "Vendors can upload food images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'food-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Vendors can update their own food images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'food-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Vendors can delete their own food images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'food-images' AND auth.uid() IS NOT NULL);

-- Create favorites table for buyers
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for favorites
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own favorites" 
ON public.favorites 
FOR DELETE 
USING (user_id = auth.uid());