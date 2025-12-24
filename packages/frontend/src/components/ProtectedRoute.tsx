import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken, isLoading } = useAuth();

  // Show loading spinner only while auth state is being initialized
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // No token or not authenticated - redirect to login
  if (!accessToken || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
