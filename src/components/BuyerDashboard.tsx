import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Star,
  User,
  Heart,
  Package,
  Search,
  Filter,
  Plus,
  Bell
} from 'lucide-react';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  vendor: {
    name: string;
    image_url: string;
  } | null;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
      image_url: string;
    };
  }>;
}

interface Favorite {
  id: string;
  vendor_id: string;
  vendors?: {
    name: string;
    description: string;
    image_url: string;
    rating: number;
  } | null;
}

interface Vendor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  rating: number;
  delivery_fee: number;
  delivery_time: string;
  category: string;
  is_active: boolean;
}

const BuyerDashboard = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || ''
  });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user orders with enhanced details
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          vendors!vendor_id(name, image_url),
          order_items(
            quantity,
            products(name, image_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Transform orders to match interface
      const transformedOrders = ordersData?.map(order => ({
        ...order,
        vendor: order.vendors || null
      })) || [];
      setOrders(transformedOrders);

      // Fetch user favorites
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('id, vendor_id')
        .eq('user_id', user.id);

      // For now, set empty array - will implement favorites properly
      setFavorites(favoritesData?.map(fav => ({
        ...fav,
        vendors: null
      })) || []);

      // Fetch all active vendors for browsing
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      setVendors(vendorsData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        address: profileForm.address
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const toggleFavorite = async (vendorId: string) => {
    try {
      const existingFavorite = favorites.find(fav => fav.vendor_id === vendorId);
      
      if (existingFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existingFavorite.id);

        if (error) throw error;

        setFavorites(prev => prev.filter(fav => fav.id !== existingFavorite.id));
        toast({
          title: "Removed from favorites",
          description: "Vendor removed from your favorites",
        });
      } else {
        // Add to favorites
        const { data, error } = await supabase
          .from('favorites')
          .insert([{ user_id: user!.id, vendor_id: vendorId }])
          .select('id, vendor_id');

        if (error) throw error;

        setFavorites(prev => [...prev, ...(data?.map(fav => ({
          ...fav,
          vendors: null
        })) || [])]);
        toast({
          title: "Added to favorites",
          description: "Vendor added to your favorites",
        });
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed':
      case 'preparing': return 'secondary';
      case 'ready': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const reorderItems = async (orderId: string) => {
    try {
      // Get order items and add to cart (simplified for demo)
      toast({
        title: "Items added to cart",
        description: "The items from this order have been added to your cart",
      });
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(vendors.map(v => v.category))];

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-lg">Loading dashboard...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{favorites.length}</div>
            <p className="text-xs text-muted-foreground">Saved vendors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="browse">Browse Menu</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Browse Restaurants</CardTitle>
              <CardDescription>Discover and order from local restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search restaurants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) => {
                  const isFavorite = favorites.some(fav => fav.vendor_id === vendor.id);
                  return (
                    <Card key={vendor.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={vendor.image_url || '/placeholder.svg'}
                          alt={vendor.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2 bg-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(vendor.id);
                          }}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{vendor.name}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{vendor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{vendor.description}</p>
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                          <span>${vendor.delivery_fee} delivery</span>
                          <span>{vendor.delivery_time}</span>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/vendor/${vendor.id}`)}
                        >
                          View Menu
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredVendors.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Track your orders and reorder your favorites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={order.vendor?.image_url || '/placeholder.svg'}
                          alt={order.vendor?.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.vendor?.name || 'Unknown Vendor'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">${order.total_amount}</p>
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{order.delivery_address}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {order.order_items?.slice(0, 3).map((item, index) => (
                        <img
                          key={index}
                          src={item.products?.image_url || '/placeholder.svg'}
                          alt={item.products?.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ))}
                      {order.order_items && order.order_items.length > 3 && (
                        <span className="text-sm text-muted-foreground">
                          +{order.order_items.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => reorderItems(order.id)}>
                        Reorder
                      </Button>
                      {order.status === 'delivered' && (
                        <Button size="sm" variant="outline">
                          <Star className="w-4 h-4 mr-1" />
                          Rate Order
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => navigate(`/vendor/${order.vendor?.name}`)}>
                        View Restaurant
                      </Button>
                    </div>
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start exploring restaurants and place your first order!
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Restaurants
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Favorite Restaurants
              </CardTitle>
              <CardDescription>Your saved restaurants for quick access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={favorite.vendors?.image_url || '/placeholder.svg'}
                        alt={favorite.vendors?.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{favorite.vendors?.name}</h3>
                        <p className="text-sm text-muted-foreground">{favorite.vendors?.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{favorite.vendors?.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => navigate(`/vendor/${favorite.vendor_id}`)}>
                        Order Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toggleFavorite(favorite.vendor_id)}
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {favorites.length === 0 && (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start browsing restaurants and save your favorites!
                  </p>
                  <Button onClick={() => navigate('/')}>
                    Discover Restaurants
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <Label htmlFor="address">Default Delivery Address</Label>
                <Textarea
                  id="address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                  placeholder="Enter your default delivery address"
                  rows={3}
                />
              </div>

              <Button onClick={handleProfileUpdate}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Address management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuyerDashboard;