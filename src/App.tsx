import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ConversationsProvider } from './contexts/ConversationsContext';
import { SocketProvider } from './contexts/SocketContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ConversationsProvider>
            <RouterProvider router={router} />
          </ConversationsProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
