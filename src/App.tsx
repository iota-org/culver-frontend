import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ConversationsProvider } from './contexts/ConversationsContext';
import { SocketProvider } from './contexts/SocketContext';
import { ContactsProvider } from './contexts/ContactsContext.tsx';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ContactsProvider>
          <SocketProvider>
            <ConversationsProvider>
              <RouterProvider router={router} />
            </ConversationsProvider>
          </SocketProvider>
        </ContactsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
