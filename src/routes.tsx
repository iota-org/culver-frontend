import { createBrowserRouter, Navigate } from 'react-router';
import Login from './pages/Login';
import MainChat from './pages/Home';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ContactDetails from './pages/ContactDetails';
import { useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainChat />
      </ProtectedRoute>
    ),
  },
  {
    path: '/chat/:conversationId',
    element: (
      <ProtectedRoute>
        <MainChat />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  // {
  //   path: '/contacts/:id',
  //   element: (
  //     <ProtectedRoute>
  //       <ContactDetails />
  //     </ProtectedRoute>
  //   ),
  // },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
