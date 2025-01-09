"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileSettings } from "@/components/ProfileSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PhoneCall, 
  Video, 
  UserPlus, 
  Settings, 
  Send,
  Search,
  MoreVertical,
  Mic,
  MicOff,
  Monitor,
  Users,
  Plus,
  LogOut
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { FriendRequests } from "@/components/FriendRequests";
import { toast } from "sonner";
import { useFriend } from "@/contexts/FriendContext";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showFriendDialog, setShowFriendDialog] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    currentChat,
    setCurrentChat,
    createGroupChat,
    userChats 
  } = useChat();
  const router = useRouter();
  const { friendRequests } = useFriend();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (friendRequests.length > 0) {
      friendRequests.forEach(request => {
        toast.message("New Friend Request", {
          description: `${request.senderName} sent you a friend request`,
          action: {
            label: "View",
            onClick: () => setShowFriendDialog(true)
          }
        });
      });
    }
  }, [friendRequests]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedContacts.length === 0) return;

    try {
      await createGroupChat(groupName, selectedContacts);
      setShowGroupDialog(false);
      setGroupName("");
      setSelectedContacts([]);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const renderChatItem = (chat: any) => {
    const otherParticipant = chat.participantDetails?.[chat.participants.find((id: string) => id !== user?.uid)];
    const displayName = chat.isGroup ? chat.groupName : otherParticipant?.displayName;
    const photoURL = chat.isGroup ? chat.groupPhoto : otherParticipant?.photoURL;

    return (
      <div
        key={chat.id}
        className={`flex items-center gap-3 p-4 hover:bg-accent cursor-pointer ${
          currentChat?.id === chat.id ? 'bg-accent' : ''
        }`}
        onClick={() => setCurrentChat(chat)}
      >
        <Avatar>
          <AvatarImage src={photoURL} />
          <AvatarFallback>
            {chat.isGroup ? (
              <Users className="h-4 w-4" />
            ) : (
              displayName?.[0] || 'U'
            )}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">{displayName}</div>
          <div className="text-sm text-muted-foreground">
            {chat.lastMessage || 'No messages yet'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sol Sidebar - Kontaklar */}
      <div className="w-80 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Avatar>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowProfileSettings(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </div>
        <div className="p-2 space-y-2">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowGroupDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
          <Button 
            variant="outline" 
            className="w-full relative"
            onClick={() => setShowFriendDialog(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friend
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {friendRequests.length}
              </span>
            )}
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-12rem)]">
          {userChats.map(renderChatItem)}
          {userChats.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              No chats yet. Add friends to start chatting!
            </div>
          )}
        </div>
      </div>

      {/* Ana Chat Alanı */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Başlığı */}
            <div className="p-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage 
                    src={currentChat.isGroup ? currentChat.groupPhoto : undefined}
                  />
                  <AvatarFallback>
                    {currentChat.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      currentChat.groupName?.[0] || 'C'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {currentChat.isGroup 
                      ? currentChat.groupName 
                      : currentChat.participants[0]
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentChat.isGroup 
                      ? `${currentChat.participants.length} members`
                      : 'Online'
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <PhoneCall className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <UserPlus className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Monitor className="h-4 w-4 mr-2" />
                      Share Screen
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Add to Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mesajlar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.senderId === user?.uid ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === user?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.senderId !== user?.uid && (
                      <div className="text-xs font-medium mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    <div className="text-sm">{msg.text}</div>
                    <div className="text-xs mt-1 opacity-70">
                      {msg.timestamp?.toDate().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Mesaj Gönderme */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-background"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* Profil Ayarları */}
      <ProfileSettings 
        open={showProfileSettings}
        onOpenChange={setShowProfileSettings}
      />

      {/* Grup Oluşturma Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group and add members to start chatting together.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input 
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div>
              <Label>Add Members</Label>
              <div className="mt-2 space-y-2">
                {userChats
                  .filter(chat => !chat.isGroup)
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                    >
                      <Checkbox
                        id={`member-${chat.id}`}
                        checked={selectedContacts.includes(chat.participants[0])}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts([...selectedContacts, chat.participants[0]]);
                          } else {
                            setSelectedContacts(
                              selectedContacts.filter(id => id !== chat.participants[0])
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`member-${chat.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {chat.participants[0][0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{chat.participants[0]}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Arkadaş Ekleme Dialog */}
      <Dialog open={showFriendDialog} onOpenChange={setShowFriendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Friend</DialogTitle>
          </DialogHeader>
          <FriendRequests />
        </DialogContent>
      </Dialog>
    </div>
  );
} 