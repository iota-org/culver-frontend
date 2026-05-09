import type { ApplicationVerifier } from 'firebase/auth';

export interface User {
  id: string;
  phone_number: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  avatar_url?: string | null;
  is_verified?: boolean;
}

export interface AuthContextType {
  user: User | null;
  sendOtp: (phone: string, appVerifier: ApplicationVerifier) => Promise<void>;
  verifyOtp: (otp: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeSetup: (fullName: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  requiresSetup: boolean;
}
