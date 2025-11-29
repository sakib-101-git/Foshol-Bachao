import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/localSync';

/**
 * Protected Route Component - Requires Authentication (A2)
 */
function ProtectedRoute({ children }) {
  const token = getToken();
  
  if (!token) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;

