import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AdminDashboard from '@/components/AdminDashboard';
import VendorDashboard from '@/components/VendorDashboard';
import BuyerDashboard from '@/components/BuyerDashboard';
import RoleBasedRedirect from '@/components/RoleBasedRedirect';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Route to appropriate dashboard based on role
  const renderDashboard = () => {
    console.log('Rendering dashboard for role:', profile.role);
    
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      case 'customer':
        return <BuyerDashboard />;
      default:
        console.log('Unknown role, defaulting to buyer dashboard');
        return <BuyerDashboard />;
    }
  };

  const getDashboardTitle = () => {
    switch (profile.role) {
      case 'admin':
        return 'Admin Control Panel';
      case 'vendor':
        return 'Vendor Management Dashboard';
      case 'customer':
        return 'Customer Dashboard';
      default:
        return 'Customer Dashboard';
    }
  };

  const getDashboardDescription = () => {
    switch (profile.role) {
      case 'admin':
        return 'Manage platform operations, vendors, and system settings';
      case 'vendor':
        return 'Manage your restaurant business, products, and orders';
      case 'customer':
        return 'Browse restaurants, place orders, and track deliveries';
      default:
        return 'Browse restaurants, place orders, and track deliveries';
    }
  };

  return (
    <RoleBasedRedirect>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
                <p className="text-muted-foreground mt-2">
                  {getDashboardDescription()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="font-semibold">{profile.full_name || profile.email}</p>
              </div>
            </div>
          </div>

          {renderDashboard()}
        </div>
      </div>
    </RoleBasedRedirect>
  );
};

export default Dashboard;