import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Store, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit,
  Trash2,
  Clock,
  Settings
} from 'lucide-react';

interface VendorApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  vendor_business_name: string;
  vendor_description: string;
  vendor_application_status: string;
  phone: string;
  address: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image_url: '' });

  // Debug log to verify this is ADMIN dashboard
  console.log('🔧 ADMIN DASHBOARD LOADED - Admin Control Panel');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch vendor applications
      const { data: applicationsData } = await supabase
        .from('profiles')
        .select('*')
        .not('vendor_application_status', 'is', null)
        .order('created_at', { ascending: false });

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setApplications(applicationsData || []);
      setCategories(categoriesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationApproval = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          vendor_application_status: status,
          role: status === 'approved' ? 'vendor' : 'customer'
        })
        .eq('user_id', userId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.user_id === userId 
            ? { ...app, vendor_application_status: status }
            : app
        )
      );

      toast({
        title: `Application ${status}`,
        description: `Vendor application has been ${status}`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
    }
  };

  const addCategory = async () => {
    if (!newCategory.name) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);

      if (error) throw error;

      toast({
        title: "Category added",
        description: "New category has been added successfully",
      });

      setNewCategory({ name: '', description: '', image_url: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !isActive })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => 
        prev.map(cat => 
          cat.id === categoryId 
            ? { ...cat, is_active: !isActive }
            : cat
        )
      );

      toast({
        title: "Category updated",
        description: `Category ${!isActive ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(user => 
          user.user_id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );

      toast({
        title: "User role updated",
        description: `User role has been updated to ${newRole}. The user will need to refresh their browser to see the new dashboard.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Vendor Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Vendor Applications
          </CardTitle>
          <CardDescription>Review and approve vendor registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.filter(app => app.vendor_application_status === 'pending').map((application) => (
              <div key={application.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{application.vendor_business_name}</h3>
                    <p className="text-sm text-muted-foreground">{application.full_name} ({application.email})</p>
                    <p className="text-sm">{application.vendor_description}</p>
                    {application.phone && (
                      <p className="text-sm text-muted-foreground">Phone: {application.phone}</p>
                    )}
                    {application.address && (
                      <p className="text-sm text-muted-foreground">Address: {application.address}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleApplicationApproval(application.user_id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleApplicationApproval(application.user_id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {applications.filter(app => app.vendor_application_status === 'pending').length === 0 && (
              <p className="text-center text-muted-foreground py-8">No pending applications</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Manage food categories for the platform</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryDescription">Description</Label>
                  <Textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                    placeholder="Enter category description"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryImage">Image URL</Label>
                  <Input
                    id="categoryImage"
                    value={newCategory.image_url}
                    onChange={(e) => setNewCategory({...newCategory, image_url: e.target.value})}
                    placeholder="Enter image URL (optional)"
                  />
                </div>
                <Button onClick={addCategory} className="w-full">
                  Add Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{category.name}</h3>
                  <Badge variant={category.is_active ? "default" : "secondary"}>
                    {category.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                >
                  {category.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {user.role !== 'admin' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateUserRole(user.user_id, user.role === 'vendor' ? 'customer' : 'vendor')}
                        >
                          Make {user.role === 'vendor' ? 'Customer' : 'Vendor'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;