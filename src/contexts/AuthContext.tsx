/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { fetchCurrentUserProfile, updateCurrentUser } from '../services';
import type { AuthContextType, UpdateProfilePayload, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('culver-user');
    return stored ? (JSON.parse(stored) as User) : null;
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
      await updateCurrentUser({ name: fullName.trim() });
    }
    const profile = await fetchCurrentUserProfile();
    setUser(profile);
  };

  const logout = async () => {
    setConfirmationResult(null);
    await signOut(auth);
    setUser(null);
  };

  const refreshProfile = async () => {
    const profile = await fetchCurrentUserProfile();
    setUser(profile);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No authenticated user found.');

    const payload: UpdateProfilePayload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.bio !== undefined) payload.bio = updates.bio.trim();
    if (updates.avatar_url !== undefined)
      payload.avatar_url = updates.avatar_url;

    if (Object.keys(payload).length === 0) return;

    const updatedUser = await updateCurrentUser(payload);
    setUser((currentUser) => ({
      ...(currentUser ?? updatedUser),
      ...updatedUser,
      // Preserve client-only fields the backend doesn't return
      username: updates.username ?? currentUser?.username,
    }));
  };

  const completeSetup = async (fullName: string) => {
    const normalizedName = fullName.trim();
    if (!normalizedName) throw new Error('Full name is required.');
    await updateProfile({ name: normalizedName });
  };

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
        refreshProfile,
        isAuthenticated: !!firebaseUser,
        isAuthReady,
        requiresSetup,
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
