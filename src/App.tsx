import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ConversationsProvider } from './contexts/ConversationsContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConversationsProvider>
          <RouterProvider router={router} />
        </ConversationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
