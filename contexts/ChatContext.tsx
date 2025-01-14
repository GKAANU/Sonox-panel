"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query as firestoreQuery,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { Message, Chat } from '@/types/chat';
import { toast } from 'react-hot-toast';

interface ChatContextType {
  messages: Message[];
  userChats: Chat[];
  sendMessage: (chatId: string, text: string) => Promise<void>;
  deleteMessages: (chatId: string) => Promise<void>;
  deleteFriend: (chatId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<any[]>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);

  // Listen for user's chats
  useEffect(() => {
    if (!user) return;

    const q = firestoreQuery(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Chat[];
      setUserChats(chats);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for messages in current chat
  useEffect(() => {
    if (!user) return;

    const unsubscribeMessages = userChats.map(chat => {
      const q = firestoreQuery(
        collection(db, `chats/${chat.id}/messages`),
        orderBy('timestamp', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const chatMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        
        setMessages(prev => {
          const otherChatMessages = prev.filter(msg => !chatMessages.find(cm => cm.id === msg.id));
          return [...otherChatMessages, ...chatMessages];
        });
      });
    });

    return () => {
      unsubscribeMessages.forEach(unsubscribe => unsubscribe());
    };
  }, [user, userChats]);

  const sendMessage = async (chatId: string, text: string) => {
    if (!user) return;

    try {
      await addDoc(collection(db, `chats/${chatId}/messages`), {
        text,
        senderId: user.uid,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessages = async (chatId: string) => {
    try {
      const messagesRef = collection(db, `chats/${chatId}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const deleteFriend = async (chatId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
      setMessages(prev => prev.filter(msg => msg.senderId !== chatId));
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) return [];
    
    try {
      const usersRef = collection(db, 'users');
      const q = searchQuery.toLowerCase();
      
      // Email ile arama
      const emailQuery = firestoreQuery(usersRef, 
        where('email', '>=', q),
        where('email', '<=', q + '\uf8ff'),
        limit(10)
      );
      
      // Kullanıcı ID ile arama
      const idQuery = firestoreQuery(usersRef,
        where('uid', '==', q)
      );
      
      const [emailResults, idResults] = await Promise.all([
        getDocs(emailQuery),
        getDocs(idQuery)
      ]);
      
      const results = new Set<DocumentData>();
      
      emailResults.forEach((doc: QueryDocumentSnapshot) => {
        if (doc.id !== user?.uid) {
          results.add({ id: doc.id, ...doc.data() });
        }
      });
      
      idResults.forEach((doc: QueryDocumentSnapshot) => {
        if (doc.id !== user?.uid) {
          results.add({ id: doc.id, ...doc.data() });
        }
      });
      
      return Array.from(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
      return [];
    }
  };

  return (
    <ChatContext.Provider value={{ messages, userChats, sendMessage, deleteMessages, deleteFriend, searchUsers }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 