import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { apiClient } from '../lib/api';
import { auth } from '../lib/firebase';
import { AuthContext } from './authContext';
import type { User } from './authTypes';

interface MeResponse {
  data: {
    user: {
      id: string;
      phone_number: string;
      name: string | null;
      avatar_url: string | null;
      bio: string | null;
      is_verified: boolean;
    };
  };
}

interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatar_url?: string | null;
}

function mapBackendUser(payload: MeResponse['data']['user']): User {
  return {
    id: payload.id,
    phone_number: payload.phone_number,
    name: payload.name || '',
    avatar_url: payload.avatar_url,
    is_verified: payload.is_verified,
    avatar: payload.avatar_url || undefined,
    bio: payload.bio || undefined,
  };
}

async function fetchCurrentUserProfile() {
  const response = await apiClient.get<MeResponse>('/auth/me');
  return mapBackendUser(response.data.data.user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('culver-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    () => auth.currentUser,
  );
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('culver-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('culver-user');
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextFirebaseUser) => {
      setFirebaseUser(nextFirebaseUser);

      if (!nextFirebaseUser) {
        setUser(null);
        setIsAuthReady(true);
        return;
      }

      try {
        const profile = await fetchCurrentUserProfile();
        setUser(profile);
      } catch {
        setUser(null);
      } finally {
        setIsAuthReady(true);
      }
    });

    return unsubscribe;
  }, []);

  const sendOtp = async (
    phone: string,
    appVerifier: import('firebase/auth').ApplicationVerifier,
  ) => {
    const result = await signInWithPhoneNumber(auth, phone, appVerifier);
    setConfirmationResult(result);
  };

  const verifyOtp = async (otp: string, fullName?: string) => {
    if (!confirmationResult) {
      throw new Error('No OTP request found. Please request a new code.');
    }

    await confirmationResult.confirm(otp);

    if (fullName) {
      await apiClient.patch('/users/me', { name: fullName.trim() });
    }

    const profile = await fetchCurrentUserProfile();
    setUser(profile);
  };

  const logout = async () => {
    setConfirmationResult(null);
    await signOut(auth);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No authenticated user found.');
    }

    const payload: UpdateProfilePayload = {};

    if (updates.name !== undefined) {
      payload.name = updates.name.trim();
    }

    if (updates.bio !== undefined) {
      payload.bio = updates.bio.trim();
    }

    if (updates.avatar_url !== undefined) {
      payload.avatar_url = updates.avatar_url;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    const response = await apiClient.patch<MeResponse>('/users/me', payload);
    const updatedUser = mapBackendUser(response.data.data.user);

    setUser((currentUser) => ({
      ...(currentUser ?? updatedUser),
      ...updatedUser,
      username: updates.username ?? currentUser?.username,
    }));
  };

  /**
   * Fallback for users who somehow end up with no name set.
   * Also used by the SetupProfile page as a safety net.
   */
  const completeSetup = async (fullName: string) => {
    const normalizedName = fullName.trim();
    if (!normalizedName) {
      throw new Error('Full name is required.');
    }

    await updateProfile({ name: normalizedName });
  };

  // True if the user is authenticated but hasn't set a name yet
  // (e.g. someone who signed up before this flow was added)
  const requiresSetup =
    !!firebaseUser && !!user && user.name.trim().length === 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        sendOtp,
        verifyOtp,
        logout,
        completeSetup,
        updateProfile,
        isAuthenticated: !!firebaseUser,
        isAuthReady,
        requiresSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
