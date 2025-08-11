import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  Upload,
  Image as ImageIcon,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  vendor_id: string;
  image_url: string;
  is_available: boolean;
  preparation_time: number;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  phone: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

interface VendorStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  bestSellingProduct: string;
}

const VendorDashboard = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    bestSellingProduct: ''
  });
  const [loading, setLoading] = useState(true);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    preparation_time: 15
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [vendorId, setVendorId] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [profileForm, setProfileForm] = useState({
    vendor_business_name: profile?.vendor_business_name || '',
    vendor_description: profile?.vendor_description || '',
    phone: profile?.phone || ''
  });

  // Debug log to verify this is VENDOR dashboard
  console.log('🏪 VENDOR DASHBOARD LOADED - Business Management Panel');

  useEffect(() => {
    fetchVendorData();
  }, [user]);

  const fetchVendorData = async () => {
    if (!user) return;

    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, is_active')
        .eq('name', profile?.vendor_business_name)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      setVendorId(vendorData.id);
      setIsOnline(vendorData.is_active);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      // Fetch orders for this vendor
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      // Fetch customer profiles for orders
      const ordersWithProfiles = [];
      if (ordersData) {
        for (const order of ordersData) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', order.user_id)
            .single();
          
          const { data: orderItemsData } = await supabase
            .from('order_items')
            .select(`
              quantity,
              products(name)
            `)
            .eq('order_id', order.id);
          
          ordersWithProfiles.push({
            ...order,
            profiles: profileData,
            order_items: orderItemsData || []
          });
        }
      }

      setProducts(productsData || []);
      setOrders(ordersWithProfiles);

      // Calculate enhanced stats
      const totalProducts = productsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const pendingOrders = ordersData?.filter(order => order.status === 'pending').length || 0;
      
      // Find best selling product from ordersWithProfiles
      const productSales: { [key: string]: number } = {};
      ordersWithProfiles?.forEach(order => {
        order.order_items?.forEach(item => {
          const productName = item.products?.name;
          if (productName) {
            productSales[productName] = (productSales[productName] || 0) + item.quantity;
          }
        });
      });
      
      const bestSellingProduct = Object.keys(productSales).reduce((a, b) => 
        productSales[a] > productSales[b] ? a : b, '') || 'None';

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders,
        bestSellingProduct
      });
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${vendorId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('food-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !vendorId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      let imageUrl = newProduct.image_url;
      
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      const { error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          image_url: imageUrl,
          vendor_id: vendorId
        }]);

      if (error) throw error;

      toast({
        title: "Product added",
        description: "Product has been added successfully",
      });

      setNewProduct({
        name: '',
        description: '',
        price: 0,
        category: '',
        image_url: '',
        preparation_time: 15
      });
      setImageFile(null);
      setImagePreview('');

      fetchVendorData();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const toggleProductAvailability = async (productId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !isAvailable })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => 
        prev.map(product => 
          product.id === productId 
            ? { ...product, is_available: !isAvailable }
            : product
        )
      );

      toast({
        title: "Product updated",
        description: `Product ${!isAvailable ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: !isOnline })
        .eq('id', vendorId);

      if (error) throw error;

      setIsOnline(!isOnline);
      toast({
        title: "Status updated",
        description: `You are now ${!isOnline ? 'online' : 'offline'}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile({
        vendor_business_name: profileForm.vendor_business_name,
        vendor_description: profileForm.vendor_description,
        phone: profileForm.phone
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-lg">Loading vendor dashboard...</div>
    </div>;
  }

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Vendor Setup Required</h2>
        <p className="text-muted-foreground">
          Your vendor account is being set up. Please contact support if this persists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Total products</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingOrders} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Average order value</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isOnline}
                    onCheckedChange={toggleOnlineStatus}
                  />
                  <Label>Online Status</Label>
                  <Badge variant={isOnline ? "default" : "secondary"}>
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Best Selling Product:</span>
                  <span className="font-semibold">{stats.bestSellingProduct}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending Orders:</span>
                  <Badge variant="destructive">{stats.pendingOrders}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage your menu items</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="productName">Product Name *</Label>
                      <Input
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Enter product description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prepTime">Prep Time (min)</Label>
                        <Input
                          id="prepTime"
                          type="number"
                          value={newProduct.preparation_time}
                          onChange={(e) => setNewProduct({...newProduct, preparation_time: parseInt(e.target.value) || 15})}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="appetizer">Appetizer</SelectItem>
                          <SelectItem value="main">Main Course</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                          <SelectItem value="beverage">Beverage</SelectItem>
                          <SelectItem value="sides">Sides</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="imageFile">Product Image</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            id="imageFile"
                            type="file"
                            accept="image/*"
                            onChange={onImageChange}
                            className="cursor-pointer"
                          />
                          <Upload className="w-4 h-4" />
                        </div>
                        
                        {imagePreview && (
                          <div className="relative w-full h-32 border rounded">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          Or paste image URL:
                        </div>
                        <Input
                          value={newProduct.image_url}
                          onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    
                    <Button onClick={addProduct} className="w-full">
                      <Package className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{product.category}</TableCell>
                      <TableCell>${product.price}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_available ? "default" : "secondary"}>
                          {product.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleProductAvailability(product.id, product.is_available)}
                        >
                          {product.is_available ? "Disable" : "Enable"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Track and manage all incoming orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.profiles?.full_name || order.profiles?.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-lg">${order.total_amount}</p>
                        <Badge variant={order.status === 'pending' ? 'destructive' : 'default'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm"><strong>Items:</strong></p>
                      {order.order_items?.map((item, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          {item.quantity}x {item.products?.name}
                        </p>
                      ))}
                      <p className="text-sm"><strong>Delivery:</strong> {order.delivery_address}</p>
                      <p className="text-sm"><strong>Phone:</strong> {order.phone}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                          Accept Order
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                          Start Preparing
                        </Button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'ready')}>
                          Mark Ready
                        </Button>
                      )}

                      {order.status === 'ready' && (
                        <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground">
                      Orders will appear here once customers start placing them.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Overview
              </CardTitle>
              <CardDescription>View your customer base and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.profiles).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{order.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm font-semibold">${order.total_amount}</p>
                    </div>
                  </div>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
                    <p className="text-muted-foreground">
                      Customer information will appear here after your first orders.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Profile & Settings
              </CardTitle>
              <CardDescription>Manage your vendor profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={profileForm.vendor_business_name}
                  onChange={(e) => setProfileForm({...profileForm, vendor_business_name: e.target.value})}
                  placeholder="Enter business name"
                />
              </div>

              <div>
                <Label htmlFor="businessDesc">Business Description</Label>
                <Textarea
                  id="businessDesc"
                  value={profileForm.vendor_description}
                  onChange={(e) => setProfileForm({...profileForm, vendor_description: e.target.value})}
                  placeholder="Describe your business"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={isOnline}
                  onCheckedChange={toggleOnlineStatus}
                />
                <Label>Accept New Orders</Label>
              </div>

              <Button onClick={handleProfileUpdate}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;