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
  getDocs,
  getDoc,
  doc,
  DocumentData,
  DocumentReference,
  updateDoc,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { Chat, Message, UserData, ChatResult } from '@/types/chat';

interface ChatContextType {
  currentChat: Chat | undefined;
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  setCurrentChat: (chat: Chat | undefined) => void;
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
  const [currentChat, setCurrentChat] = useState<Chat | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userChats, setUserChats] = useState<Chat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const friendsQuery = query(
      collection(db, 'friends'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      const chatsData = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const chatData = docSnapshot.data();
          const participantDetails: { [key: string]: any } = {};
          
          for (const participantId of chatData.participants) {
            if (participantId !== user.uid) {
              const userDocRef = doc(db, 'users', participantId);
              const userDoc = await getDoc(userDocRef);
              if (userDoc.exists()) {
                const userData = userDoc.data() as UserData;
                participantDetails[participantId] = {
                  displayName: userData.displayName,
                  photoURL: userData.photoURL
                };
              }
            }
          }

          return {
            id: docSnapshot.id,
            participants: chatData.participants,
            isGroup: chatData.isGroup || false,
            groupName: chatData.groupName,
            lastMessage: chatData.lastMessage,
            participantDetails
          } as Chat;
        })
      );
      setUserChats(chatsData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentChat) return;

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

  const sendMessage = async (text: string): Promise<void> => {
    if (!currentChat || !user) return;

    try {
      const messageRef = await addDoc(collection(db, `chats/${currentChat.id}/messages`), {
        text,
        senderId: user.uid,
        senderName: user.displayName,
        timestamp: serverTimestamp()
      });

      // Update lastMessage in both collections
      const chatRef = doc(db, 'chats', currentChat.id);
      const friendRef = doc(db, 'friends', currentChat.id);
      const updateData = {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp()
      };

      await Promise.all([
        updateDoc(chatRef, updateData),
        updateDoc(friendRef, updateData)
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const createGroupChat = async (name: string, participants: string[]) => {
    if (!user) return;
    
    try {
      // Create group chat document
      const groupChatRef = await addDoc(collection(db, 'chats'), {
        isGroup: true,
        groupName: name,
        participants: [...participants, user.uid],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp()
      });

      // Get participant details
      const participantDetails: { [key: string]: any } = {};
      for (const participantId of [...participants, user.uid]) {
        const userDoc = await getDoc(doc(db, 'users', participantId));
        if (userDoc.exists()) {
          participantDetails[participantId] = {
            displayName: userDoc.data().displayName,
            photoURL: userDoc.data().photoURL
          };
        }
      }

      // Create group in friends collection for sidebar listing
      await addDoc(collection(db, 'friends'), {
        id: groupChatRef.id,
        isGroup: true,
        groupName: name,
        participants: [...participants, user.uid],
        participantDetails,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp()
      });

      // Set current chat to the new group
      setCurrentChat({
        id: groupChatRef.id,
        isGroup: true,
        groupName: name,
        participants: [...participants, user.uid],
        participantDetails,
        lastMessage: ''
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