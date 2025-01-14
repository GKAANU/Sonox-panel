"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Settings,
  UserPlus,
  Users,
  Video,
  Send,
  ArrowLeft,
  MessageSquare,
  Trash2,
  Eraser,
  Phone,
  LogOut
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useCall } from "@/contexts/CallContext";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { Chat } from "@/types/chat";
import { ProfileSettings } from "@/components/ProfileSettings";
import { FriendRequests } from "@/components/FriendRequests";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ChatPage() {
  const router = useRouter();
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const { user: currentUser, signOut } = useAuth();
  const { messages, userChats, sendMessage, deleteMessages, deleteFriend } = useChat();
  const { callUser } = useCall();

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth');
    }
  }, [currentUser, router]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    setShowChat(true);
  };

  const handleCall = (type: 'audio' | 'video') => {
    if (!selectedChat) return;
    const otherUserId = selectedChat.participants.find(id => id !== currentUser?.uid);
    if (otherUserId) {
      callUser(otherUserId, type === 'video');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    sendMessage(selectedChat.id, newMessage);
    setNewMessage("");
  };

  const handleDeleteMessages = (chat: Chat) => {
    deleteMessages(chat.id);
  };

  const handleDeleteFriend = (chat: Chat) => {
    deleteFriend(chat.id);
    setSelectedChat(null);
  };

  if (!currentUser) return null;

  const renderChatList = () => {
    if (!userChats || userChats.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Chats Yet</h3>
            <p>Click the + button to add friends</p>
          </div>
        </div>
      );
    }

    return userChats.map((chat) => {
      if (!chat || !chat.participants || !chat.participantDetails) return null;

      const otherParticipant = chat.participants.find(id => id !== currentUser?.uid);
      if (!otherParticipant) return null;

      const participantDetails = chat.participantDetails[otherParticipant];
      if (!participantDetails) return null;

      return (
        <Button
          key={chat.id}
          variant={selectedChat?.id === chat.id ? "secondary" : "ghost"}
          className="w-full justify-start gap-3 h-16"
          onClick={() => handleSelectChat(chat)}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={participantDetails.photoURL || ''} />
            <AvatarFallback>
              {chat.isGroup ? (
                <Users className="h-4 w-4" />
              ) : (
                participantDetails.displayName?.[0] || 'U'
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="font-semibold">
              {chat.isGroup ? chat.groupName : participantDetails.displayName}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {chat.lastMessage || ''}
            </div>
          </div>
        </Button>
      );
    });
  };

  const renderSelectedChatHeader = () => {
    if (!selectedChat || !currentUser) return null;

    const otherParticipant = selectedChat.participants.find(id => id !== currentUser.uid);
    if (!otherParticipant) return null;

    const participantDetails = selectedChat.participantDetails[otherParticipant];
    if (!participantDetails) return null;

    return (
      <>
        <Avatar className="w-10 h-10">
          <AvatarImage src={participantDetails.photoURL || ''} />
          <AvatarFallback>
            {participantDetails.displayName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">
            {participantDetails.displayName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {participantDetails.email}
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r bg-muted/10 transition-all duration-300",
        showChat && "hidden md:block"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentUser?.photoURL || ''} />
                  <AvatarFallback>{currentUser?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{currentUser?.displayName}</h2>
                  <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSettings(true)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={() => setShowFriendRequests(true)}>
                <UserPlus className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="space-y-2">
              {renderChatList()}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !showChat && "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            <div className="h-16 border-b flex items-center justify-between px-4 bg-muted/5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowChat(false)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                {renderSelectedChatHeader()}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleCall('audio')}>
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleCall('video')}>
                  <Video className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleDeleteFriend(selectedChat)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Friend
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteMessages(selectedChat)}>
                      <Eraser className="w-4 h-4 mr-2" />
                      Delete Messages
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.senderId === currentUser?.uid ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[70%] rounded-lg p-3",
                      message.senderId === currentUser?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground">
                Select a friend from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <ProfileSettings />
        </DialogContent>
      </Dialog>

      {/* Friend Requests Dialog */}
      <Dialog open={showFriendRequests} onOpenChange={setShowFriendRequests}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Friend Requests</DialogTitle>
          </DialogHeader>
          <FriendRequests />
        </DialogContent>
      </Dialog>
    </div>
  );
}
