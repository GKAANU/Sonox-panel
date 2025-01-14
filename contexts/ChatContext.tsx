"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { Message, Chat } from '@/types/chat';

interface ChatContextType {
  messages: Message[];
  userChats: Chat[];
  sendMessage: (chatId: string, text: string) => Promise<void>;
  deleteMessages: (chatId: string) => Promise<void>;
  deleteFriend: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);

  // Listen for user's chats
  useEffect(() => {
    if (!user) return;

    const q = query(
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
      const q = query(
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

  return (
    <ChatContext.Provider value={{ messages, userChats, sendMessage, deleteMessages, deleteFriend }}>
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