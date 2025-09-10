import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

const RoleBasedRedirect = ({ children }: RoleBasedRedirectProps) => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile?.role) {
      const currentPath = window.location.pathname;
      
      // If user is on /dashboard, redirect to role-specific dashboard
      if (currentPath === '/dashboard') {
        switch (profile.role) {
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'vendor':
            navigate('/vendor/dashboard', { replace: true });
            break;
          case 'customer':
            navigate('/customer/dashboard', { replace: true });
            break;
          default:
            navigate('/customer/dashboard', { replace: true });
        }
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRedirect;