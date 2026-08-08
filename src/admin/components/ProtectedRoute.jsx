import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import GlobalLoader from '../../components/loading/GlobalLoader';

export default function ProtectedRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return <GlobalLoader visible />;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
