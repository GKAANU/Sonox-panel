"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: any;
}

interface FriendContextType {
  friendRequests: FriendRequest[];
  friends: any[];
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<any[]>;
  searchUserById: (userId: string) => Promise<any | null>;
}

const FriendContext = createContext<FriendContextType | null>(null);

export const useFriend = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
};

export const FriendProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Listen to friend requests
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as FriendRequest));
      setFriendRequests(requests);
    });

    // Listen to friends
    const friendsQuery = query(
      collection(db, 'friends'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      const friendsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFriends(friendsList);
    });

    // Listen to sent requests
    const sentRequestsQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribeSentRequests = onSnapshot(sentRequestsQuery, (snapshot) => {
      const sentIds = new Set(snapshot.docs.map(doc => doc.data().receiverId));
      setSentRequests(sentIds);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeFriends();
      unsubscribeSentRequests();
    };
  }, [user]);

  const sendFriendRequest = async (userId: string) => {
    if (!user) throw new Error('No user logged in');
    
    // Check if request already exists
    const existingQuery = query(
      collection(db, 'friendRequests'),
      where('senderId', '==', user.uid),
      where('receiverId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const existingDocs = await getDocs(existingQuery);
    if (!existingDocs.empty) {
      throw new Error('Friend request already sent');
    }

    const receiverDoc = await getDoc(doc(db, 'users', userId));
    if (!receiverDoc.exists()) throw new Error('User not found');

    await addDoc(collection(db, 'friendRequests'), {
      senderId: user.uid,
      senderName: user.displayName,
      senderPhoto: user.photoURL,
      receiverId: userId,
      status: 'pending',
      timestamp: serverTimestamp()
    });
  };

  const acceptFriendRequest = async (requestId: string) => {
    if (!user) throw new Error('No user logged in');

    const requestRef = doc(db, 'friendRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) throw new Error('Request not found');
    
    const request = requestDoc.data() as FriendRequest;

    // Update request status
    await updateDoc(requestRef, { status: 'accepted' });

    // Create friend relationship
    await addDoc(collection(db, 'friends'), {
      participants: [request.senderId, request.receiverId],
      timestamp: serverTimestamp()
    });
  };

  const rejectFriendRequest = async (requestId: string) => {
    if (!user) throw new Error('No user logged in');

    const requestRef = doc(db, 'friendRequests', requestId);
    await deleteDoc(requestRef);
  };

  const searchUsers = async (searchQuery: string) => {
    if (!user) throw new Error('No user logged in');
    if (!searchQuery.trim()) return [];

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '>=', searchQuery), where('displayName', '<=', searchQuery + '\uf8ff'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.id !== user.uid); // Kendini hariç tut
  };

  const searchUserById = async (userId: string) => {
    if (!user) throw new Error('No user logged in');
    if (userId === user.uid) throw new Error('Cannot search for yourself');

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  };

  const value = {
    friendRequests,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    searchUserById
  };

  return (
    <FriendContext.Provider value={value}>
      {children}
    </FriendContext.Provider>
  );
}; 