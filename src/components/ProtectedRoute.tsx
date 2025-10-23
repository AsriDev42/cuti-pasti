import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'user' | 'admin_unit' | 'admin_pusat';
  requireActive?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requireRole,
  requireActive = false 
}: ProtectedRouteProps) => {
  const { user, profile, loading, hasRole: checkUserRole } = useAuth();
  const [roleChecking, setRoleChecking] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (requireRole && user) {
        setRoleChecking(true);
        const roleMap = {
          'user': 'user' as const,
          'admin_unit': 'admin_unit' as const,
          'admin_pusat': 'admin_pusat' as const,
        };
        const roleResult = await checkUserRole(roleMap[requireRole]);
        setHasRequiredRole(roleResult);
        setRoleChecking(false);
      }
    };

    checkRole();
  }, [requireRole, user, checkUserRole]);

  if (loading || roleChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireActive && profile.status !== 'active') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireRole && !hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
