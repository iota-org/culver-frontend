import { Navigate } from 'react-router';
import { useAuth } from '../contexts/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady, requiresSetup } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresSetup) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady, requiresSetup } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return requiresSetup ? (
    <Navigate to="/signup" replace />
  ) : (
    <Navigate to="/" replace />
  );
}

export function SignupRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady, requiresSetup } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return requiresSetup ? <>{children}</> : <Navigate to="/" replace />;
}
