import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Vendor {
  id: string;
  name: string;
  delivery_fee: number;
  min_order: number;
}

const Checkout = () => {
  const { items, getTotalPrice, getVendorId, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    delivery_address: '',
    notes: ''
  });

  const subtotal = getTotalPrice();
  const deliveryFee = vendor?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchVendor = async () => {
      const vendorId = getVendorId();
      if (!vendorId) {
        navigate('/cart');
        return;
      }

      const { data } = await supabase
        .from('vendors')
        .select('id, name, delivery_fee, min_order')
        .eq('id', vendorId)
        .single();

      setVendor(data);
    };

    fetchVendor();
  }, [user, getVendorId, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlaceOrder = async () => {
    if (!user || !vendor) return;

    if (vendor && subtotal < vendor.min_order) {
      toast({
        title: "Minimum order not met",
        description: `Minimum order amount is $${vendor.min_order.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (!formData.phone || !formData.delivery_address) {
      toast({
        title: "Missing information",
        description: "Please fill in phone number and delivery address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          vendor_id: vendor.id,
          total_amount: total,
          delivery_fee: deliveryFee,
          phone: formData.phone,
          delivery_address: formData.delivery_address,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      clearCart();

      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id.slice(0, 8)} has been placed.`
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Failed to place order",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!vendor || items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">No items in cart</h1>
            <Button onClick={() => navigate('/')} variant="food">
              Continue Shopping
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery_address">Delivery Address *</Label>
                  <Textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleInputChange}
                    placeholder="Enter your full delivery address"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any special instructions..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="pb-4 border-b">
                <p className="font-medium">{vendor.name}</p>
                {subtotal < vendor.min_order && (
                  <p className="text-sm text-destructive">
                    Minimum order: ${vendor.min_order.toFixed(2)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={handlePlaceOrder}
                className="w-full"
                variant="food"
                disabled={loading || subtotal < vendor.min_order}
              >
                {loading ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;