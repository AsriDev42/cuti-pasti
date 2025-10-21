import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'user' | 'admin_unit' | 'admin_pusat';
  requireActive?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  requireRole,
  requireActive = true
}: ProtectedRouteProps) => {
  const { user, profile, loading, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      navigate('/login');
      return;
    }

    if (requireActive && profile?.status !== 'active') {
      if (profile?.status === 'pending_approval') {
        navigate('/pending-approval');
        return;
      }
      if (profile?.status === 'rejected') {
        navigate('/rejected');
        return;
      }
    }

    if (requireRole && !hasRole(requireRole)) {
      navigate('/unauthorized');
      return;
    }
  }, [user, profile, loading, requireAuth, requireRole, requireActive, navigate, hasRole]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && requireAuth) return null;
  if (requireActive && profile?.status !== 'active') return null;
  if (requireRole && !hasRole(requireRole)) return null;

  return <>{children}</>;
};
