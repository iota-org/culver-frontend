import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  phone_number: string;
  name: string;
  username?: string;
  avatar?: string;
  about?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('culver-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('culver-token');
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('culver-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('culver-user');
    }
  }, [user]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('culver-token', accessToken);
    } else {
      localStorage.removeItem('culver-token');
    }
  }, [accessToken]);

  const login = async (phone: string, otp: string) => {
    const mockUser: User = {
      id: '1',
      phone_number: phone,
      name: 'Albasta',
      username: 'albasta',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      about: 'Hey there! I am using Culver.',
    };
    const mockToken = 'mock_access_token_' + Date.now();

    setUser(mockUser);
    setAccessToken(mockToken);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user && !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
