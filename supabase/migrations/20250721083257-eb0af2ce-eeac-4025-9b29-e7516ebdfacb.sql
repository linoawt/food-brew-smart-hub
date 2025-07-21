-- Create vendors table for restaurants/breweries
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL, -- 'restaurant' or 'brewery'
  rating DECIMAL(2,1) DEFAULT 0,
  delivery_time TEXT,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  min_order DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for menu items
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL, -- 'food', 'drink', 'beer', 'wine'
  is_available BOOLEAN DEFAULT true,
  preparation_time INTEGER DEFAULT 15, -- minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer', -- 'customer', 'vendor', 'admin'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
  delivery_address TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  stripe_payment_intent_id TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors (readable by all, manageable by admin/vendor)
CREATE POLICY "Vendors are viewable by everyone" ON public.vendors FOR SELECT USING (true);
CREATE POLICY "Vendors can be managed by admins" ON public.vendors FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'vendor'))
);

-- RLS Policies for products (readable by all, manageable by vendor/admin)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products can be managed by vendor owners or admins" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'vendor'))
);

-- RLS Policies for profiles (users can manage their own)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for orders (users can see their own, vendors can see their orders, admins see all)
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own pending orders" ON public.orders FOR UPDATE USING (
  user_id = auth.uid() AND status = 'pending'
);
CREATE POLICY "Vendors can view orders for their restaurant" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vendor', 'admin'))
);
CREATE POLICY "Vendors can update orders for their restaurant" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vendor', 'admin'))
);

-- RLS Policies for order items (same as orders)
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create order items for their orders" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Vendors can view order items for their orders" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vendor', 'admin'))
);

-- RLS Policies for reviews (users can manage their own, all can read)
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (user_id = auth.uid());

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.vendors (name, description, category, rating, delivery_time, delivery_fee, min_order, image_url) VALUES
('Bella Vista Restaurant', 'Authentic Italian cuisine with fresh ingredients', 'restaurant', 4.5, '25-35 min', 3.99, 15.00, '/placeholder.svg'),
('Craft Beer House', 'Local craft brewery with artisanal beers', 'brewery', 4.8, '30-40 min', 2.99, 20.00, '/placeholder.svg'),
('Dragon Palace', 'Traditional Chinese dishes and dim sum', 'restaurant', 4.3, '20-30 min', 4.99, 12.00, '/placeholder.svg'),
('Hoppy Trails Brewery', 'Award-winning IPAs and seasonal brews', 'brewery', 4.7, '35-45 min', 3.49, 25.00, '/placeholder.svg'),
('Taco Fiesta', 'Authentic Mexican street food and tacos', 'restaurant', 4.4, '15-25 min', 2.99, 10.00, '/placeholder.svg');

INSERT INTO public.products (vendor_id, name, description, price, category, image_url) VALUES
-- Bella Vista Restaurant
((SELECT id FROM public.vendors WHERE name = 'Bella Vista Restaurant'), 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomato sauce, and basil', 16.99, 'food', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Bella Vista Restaurant'), 'Chicken Alfredo', 'Creamy pasta with grilled chicken and parmesan', 18.99, 'food', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Bella Vista Restaurant'), 'Caesar Salad', 'Crisp romaine lettuce with caesar dressing and croutons', 12.99, 'food', '/placeholder.svg'),
-- Craft Beer House
((SELECT id FROM public.vendors WHERE name = 'Craft Beer House'), 'IPA Flight', 'Tasting flight of 4 different IPAs', 14.99, 'drink', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Craft Beer House'), 'Stout Pint', 'Rich and creamy chocolate stout', 8.99, 'drink', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Craft Beer House'), 'Beer Cheese Pretzel', 'Soft pretzel with house-made beer cheese', 9.99, 'food', '/placeholder.svg'),
-- Dragon Palace
((SELECT id FROM public.vendors WHERE name = 'Dragon Palace'), 'Kung Pao Chicken', 'Spicy stir-fried chicken with peanuts', 15.99, 'food', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Dragon Palace'), 'Dim Sum Platter', 'Assorted dumplings and steamed buns', 22.99, 'food', '/placeholder.svg'),
-- Hoppy Trails Brewery
((SELECT id FROM public.vendors WHERE name = 'Hoppy Trails Brewery'), 'Seasonal IPA', 'Limited edition seasonal IPA', 9.99, 'drink', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Hoppy Trails Brewery'), 'Wings & Beer Combo', '10 wings with choice of beer', 19.99, 'food', '/placeholder.svg'),
-- Taco Fiesta
((SELECT id FROM public.vendors WHERE name = 'Taco Fiesta'), 'Taco Trio', 'Three tacos: carnitas, chicken, and veggie', 13.99, 'food', '/placeholder.svg'),
((SELECT id FROM public.vendors WHERE name = 'Taco Fiesta'), 'Guacamole & Chips', 'Fresh made guacamole with tortilla chips', 7.99, 'food', '/placeholder.svg');