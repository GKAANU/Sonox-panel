export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
}

export interface Chat {
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

export interface UserData {
  displayName: string;
  photoURL: string | null;
  email: string;
  uid: string;
}

export interface ChatResult {
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