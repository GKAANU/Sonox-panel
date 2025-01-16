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
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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
        status: 'online',
        friends: [],
        friendRequests: []
      };

      if (!userSnap.exists()) {
        await setDoc(userRef, userData);
        console.log('User document created successfully');
      } else {
        // Update lastSeen and status for existing users
        await setDoc(userRef, {
          lastSeen: serverTimestamp(),
          status: 'online'
        }, { merge: true });
        console.log('User document updated successfully');
      }
    } catch (error) {
      console.error('Error managing user document:', error);
      // Don't throw the error here, just log it
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Set persistence first
        await setPersistence(auth, browserLocalPersistence);
        console.log('Auth persistence set to LOCAL');
      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      
      if (user) {
        setUser(user);
        try {
          await createUserDocument(user);
          // Only redirect if we're on the login page
          if (window.location.pathname === '/') {
            router.push('/chat');
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        }
      } else {
        setUser(null);
        // Only redirect if we're not already on the login page
        if (window.location.pathname !== '/') {
          router.push('/');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in successful:', result.user.email);
      
      // Wait for user document creation
      await createUserDocument(result.user);
      router.push('/chat');
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast.error(error.message || 'Error signing in with Google');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
      router.push('/chat');
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Error signing in');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      await createUserDocument(user);
      router.push('/chat');
      toast.success('Account created successfully');
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Error creating account');
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