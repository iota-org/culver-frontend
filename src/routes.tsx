import { createBrowserRouter, Navigate } from 'react-router';
import Login from './pages/Login';
import SetupProfile from './pages/SetupProfile';
import MainChat from './pages/Home';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import {
  ProtectedRoute,
  PublicRoute,
  SignupRoute,
} from './components/RouteGuards';

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
    path: '/signup',
    element: (
      <SignupRoute>
        <SetupProfile />
      </SignupRoute>
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
