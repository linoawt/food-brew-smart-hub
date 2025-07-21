import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Truck, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Vendor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  rating: number;
  delivery_time: string;
  delivery_fee: number;
  min_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  vendor_id: string;
}

const Products = () => {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchVendorAndProducts = async () => {
      if (!vendorId) return;

      try {
        // Fetch vendor details
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .single();

        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('is_available', true);

        setVendor(vendorData);
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorAndProducts();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Vendor not found</div>
        </div>
      </div>
    );
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      vendor_id: product.vendor_id,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Vendor Header */}
      <div className="bg-gradient-subtle py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <img
              src={vendor.image_url}
              alt={vendor.name}
              className="w-32 h-32 rounded-lg object-cover"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-primary mb-2">{vendor.name}</h1>
              <p className="text-muted-foreground mb-4">{vendor.description}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span className="font-medium">{vendor.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{vendor.delivery_time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span>${vendor.delivery_fee} delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-elegant transition-shadow">
              <CardHeader className="p-0">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <CardDescription className="mb-4">{product.description}</CardDescription>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    variant="food"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Products;