import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');
  const loginTime = localStorage.getItem('loginTime');

  console.log('ProtectedRoute Check:', { token: !!token, userRole, username, requiredRole });

  // Check if user is logged in with complete session
  if (!token || !userRole || !username) {
    console.log('Missing session data, clearing and redirecting');
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Check if login is recent (within last 24 hours)
  if (loginTime) {
    const loginTimestamp = parseInt(loginTime);
    const now = Date.now();
    const hoursPassed = (now - loginTimestamp) / (1000 * 60 * 60);
    
    if (hoursPassed > 24) {
      console.log('Session expired (24h), clearing and redirecting');
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  }

  // Validate token format (basic check)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('Invalid token format, clearing and redirecting');
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.log('Token validation error, clearing and redirecting');
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && userRole !== 'admin' && userRole !== 'superadmin') {
      console.log('Insufficient admin privileges, clearing and redirecting');
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
    if (requiredRole === 'user' && (userRole === 'admin' || userRole === 'superadmin')) {
      console.log('Admin trying to access user route, redirecting to admin');
      return <Navigate to="/admin" replace />;
    }
  }

  console.log('Access granted');
  return children;
};

export default ProtectedRoute;