"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  senderName: string;
  senderPhoto?: string;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  isGroup: boolean;
  groupName?: string;
  groupPhoto?: string;
}

interface ChatContextType {
  currentChat: Chat | null;
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  setCurrentChat: (chat: Chat) => void;
  createGroupChat: (name: string, participants: string[]) => Promise<void>;
  userChats: Chat[];
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Kullanıcının sohbetlerini dinle
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
      });
      setUserChats(chats);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentChat) return;

    // Mevcut sohbetin mesajlarını dinle
    const q = query(
      collection(db, `chats/${currentChat.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [currentChat]);

  const sendMessage = async (text: string) => {
    if (!currentChat || !user) return;

    try {
      await addDoc(collection(db, `chats/${currentChat.id}/messages`), {
        text,
        senderId: user.uid,
        senderName: user.displayName,
        senderPhoto: user.photoURL,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const createGroupChat = async (name: string, participants: string[]) => {
    if (!user) return;

    try {
      const allParticipants = [...participants, user.uid];
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: allParticipants,
        isGroup: true,
        groupName: name,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });

      setCurrentChat({
        id: chatRef.id,
        participants: allParticipants,
        isGroup: true,
        groupName: name
      });
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  };

  const value = {
    currentChat,
    messages,
    sendMessage,
    setCurrentChat,
    createGroupChat,
    userChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 