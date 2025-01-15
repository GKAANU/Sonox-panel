"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  User, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserDocument = async (user: User) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        status: 'online'
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, userData);
      } else {
        // Update lastSeen and status for existing users
        await setDoc(userRef, {
          lastSeen: serverTimestamp(),
          status: 'online'
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error managing user document:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        await createUserDocument(user);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { 
          status: 'offline', 
          lastSeen: serverTimestamp() 
        }, { merge: true });
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserDocument(result.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await createUserDocument(user);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, signInWithGoogle, signIn, signUp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 