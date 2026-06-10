import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleDashboards = {
  admin: '/admin/dashboard',
  librarian: '/librarian/dashboard',
  student: '/user/dashboard',
  staff: '/user/dashboard',
};

export default function RoleRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    const redirectPath = roleDashboards[user?.role] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
