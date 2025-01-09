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
  DocumentReference
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
  participantDetails: {
    [key: string]: {
      displayName: string;
      photoURL: string | null;
    }
  };
}

interface UserData {
  displayName: string;
  photoURL: string | null;
  email: string;
  uid: string;
}

interface ChatResult {
  id: string;
  participants: string[];
  isGroup: boolean;
  participantDetails: {
    [key: string]: {
      displayName: string;
      photoURL: string | null;
    }
  };
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

    const friendsQuery = query(
      collection(db, 'friends'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      const chatsPromises = snapshot.docs.map(async (docSnapshot) => {
        const friendData = docSnapshot.data();
        const otherUserId = friendData.participants.find((id: string) => id !== user.uid);
        
        if (!otherUserId) return null;

        // Get other user's details
        const userDocRef = doc(db, 'users', otherUserId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data() as UserData | undefined;

        // Check if chat already exists
        const chatQuery = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', user.uid)
        );
        const chatSnapshot = await getDocs(chatQuery);
        let chatId = '';

        // Find existing chat or create new one
        const existingChat = chatSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.participants.includes(otherUserId) && !data.isGroup;
        });

        if (existingChat) {
          chatId = existingChat.id;
        } else {
          // Create new chat
          const chatRef = await addDoc(collection(db, 'chats'), {
            participants: [user.uid, otherUserId],
            isGroup: false,
            createdAt: serverTimestamp()
          });
          chatId = chatRef.id;
        }

        const newChat: Chat = {
          id: chatId,
          participants: [user.uid, otherUserId],
          isGroup: false,
          participantDetails: {
            [otherUserId]: {
              displayName: userData?.displayName || 'Unknown User',
              photoURL: userData?.photoURL || null
            }
          }
        };

        return newChat;
      });

      const validChats = (await Promise.all(chatsPromises)).filter((chat): chat is Chat => chat !== null);
      
      setUserChats(prevChats => {
        const groupChats = prevChats.filter(chat => chat.isGroup);
        return [...groupChats, ...validChats];
      });
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
      
      // Get participant details
      const participantDetailsPromises = participants.map(async (participantId) => {
        const userDoc = await getDoc(doc(db, 'users', participantId));
        const userData = userDoc.data() as UserData | undefined;
        return [participantId, {
          displayName: userData?.displayName || 'Unknown User',
          photoURL: userData?.photoURL || null
        }] as const;
      });

      const participantDetailsArray = await Promise.all(participantDetailsPromises);
      const participantDetails = Object.fromEntries(participantDetailsArray);

      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: allParticipants,
        isGroup: true,
        groupName: name,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        participantDetails
      });

      setCurrentChat({
        id: chatRef.id,
        participants: allParticipants,
        isGroup: true,
        groupName: name,
        participantDetails: {
          ...participantDetails,
          [user.uid]: {
            displayName: user.displayName || 'Unknown User',
            photoURL: user.photoURL || null
          }
        }
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