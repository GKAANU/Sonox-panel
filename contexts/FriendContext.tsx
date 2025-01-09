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
  serverTimestamp
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

  // Arkadaşlık isteklerini dinle
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [user]);

  // Arkadaş listesini dinle
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'friends'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const friendsList: any[] = [];
      snapshot.forEach((doc) => {
        friendsList.push({ id: doc.id, ...doc.data() });
      });
      setFriends(friendsList);
    });

    return () => unsubscribe();
  }, [user]);

  const sendFriendRequest = async (userId: string) => {
    if (!user) throw new Error('No user logged in');

    // Önceki istekleri kontrol et
    const existingRequests = await getDocs(
      query(
        collection(db, 'friendRequests'),
        where('senderId', '==', user.uid),
        where('receiverId', '==', userId)
      )
    );

    if (!existingRequests.empty) {
      throw new Error('Friend request already sent');
    }

    // Arkadaşlık isteği gönder
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
    const request = (await getDocs(query(collection(db, 'friendRequests'), where('id', '==', requestId)))).docs[0].data() as FriendRequest;

    // İsteği güncelle
    await updateDoc(requestRef, { status: 'accepted' });

    // Arkadaşlık ilişkisi oluştur
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

  const value = {
    friendRequests,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers
  };

  return (
    <FriendContext.Provider value={value}>
      {children}
    </FriendContext.Provider>
  );
}; 