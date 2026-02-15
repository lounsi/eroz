import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to home or unauthorized page if role doesn't match
        // For now redirect to their dashboard based on role? Or just root.
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
