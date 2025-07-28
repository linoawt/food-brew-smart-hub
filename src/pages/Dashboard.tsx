import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AdminDashboard from '@/components/AdminDashboard';
import VendorDashboard from '@/components/VendorDashboard';
import BuyerDashboard from '@/components/BuyerDashboard';

const Dashboard = () => {
  const { user, profile } = useAuth();

  // Redirect if not authenticated
  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  // Route to appropriate dashboard based on role
  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'vendor':
        return <VendorDashboard />;
      default:
        return <BuyerDashboard />;
    }
  };

const getDashboardTitle = () => {
    switch (profile.role) {
      case 'admin':
        return 'Admin Dashboard';
      case 'vendor':
        return 'Vendor Dashboard';
      default:
        return 'Buyer Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{getDashboardTitle()}</h1>
          <p className="text-muted-foreground">
            {profile.role === 'admin' 
              ? 'Manage your platform and view analytics'
              : profile.role === 'vendor'
              ? 'Manage your business, products and orders'
              : 'Browse restaurants, place orders and track deliveries'
            }
          </p>
        </div>

        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;