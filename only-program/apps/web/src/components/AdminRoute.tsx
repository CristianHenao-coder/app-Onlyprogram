import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRoute = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-silver/60 animate-pulse font-medium">Verificando credenciales de Admin...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
