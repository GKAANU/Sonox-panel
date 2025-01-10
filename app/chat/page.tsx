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
  LogOut,
  ArrowLeft,
  PhoneOff
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useRouter } from "next/navigation";
import { FriendRequests } from "@/components/FriendRequests";
import { toast } from "sonner";
import { useFriend } from "@/contexts/FriendContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  collection, 
  doc, 
  deleteDoc, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CallInterface } from "@/components/call/CallInterface";
import { useCall } from "@/components/call/CallProvider";
import { Chat } from "@/types/chat";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showFriendDialog, setShowFriendDialog] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteType, setDeleteType] = useState<'messages' | 'friend' | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<any>(null);
  const [isVideo, setIsVideo] = useState(false);

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
  const { callUser, call, callAccepted } = useCall();

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
      toast.error('Failed to send message');
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

  const handleDeleteMessages = async () => {
    if (!currentChat) return;
    try {
      const messagesRef = collection(db, `chats/${currentChat.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);
      
      messagesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      setShowDeleteAlert(false);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  const handleDeleteFriend = async () => {
    if (!currentChat) return;
    try {
      const friendRef = doc(db, 'friends', currentChat.id);
      await deleteDoc(friendRef);
      
      const chatRef = doc(db, 'chats', currentChat.id);
      await deleteDoc(chatRef);
      
      setCurrentChat(undefined);
      setShowDeleteAlert(false);
    } catch (error) {
      console.error('Error deleting friend:', error);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    if (!user || !chat) return null;
    const otherUserId = chat.participants.find((id: string) => id !== user.uid);
    return otherUserId ? chat.participantDetails[otherUserId] : null;
  };

  const renderChatHeader = () => {
    if (!currentChat) return null;
    const otherParticipant = getOtherParticipant(currentChat);

    return (
      <div className="p-4 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={currentChat.isGroup ? currentChat.groupPhoto || undefined : otherParticipant?.photoURL || undefined} />
            <AvatarFallback>
              {currentChat.isGroup ? (
                <Users className="h-4 w-4" />
              ) : (
                otherParticipant?.displayName?.[0] || 'U'
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
              {currentChat.isGroup 
                ? currentChat.groupName 
                : otherParticipant?.displayName
              }
            </div>
            <div className="text-sm text-muted-foreground">
              {currentChat.isGroup 
                ? `${currentChat.participants.length} members`
                : ''
              }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleCall(false)}
            disabled={currentChat.isGroup}
          >
            <PhoneCall className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleCall(true)}
            disabled={currentChat.isGroup}
          >
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setDeleteType('messages');
                setShowDeleteAlert(true);
              }}>
                Delete Messages
              </DropdownMenuItem>
              {!currentChat.isGroup && (
                <DropdownMenuItem onClick={() => {
                  setDeleteType('friend');
                  setShowDeleteAlert(true);
                }}>
                  Remove Friend
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const renderChatItem = (chat: Chat) => {
    const otherParticipant = getOtherParticipant(chat);
    const displayName = chat.isGroup ? chat.groupName : otherParticipant?.displayName;
    const photoURL = chat.isGroup ? chat.groupPhoto || undefined : otherParticipant?.photoURL || undefined;

    return (
      <div
        key={chat.id}
        className={`flex items-center justify-between p-4 hover:bg-accent cursor-pointer ${
          currentChat?.id === chat.id ? 'bg-accent' : ''
        }`}
      >
        <div 
          className="flex items-center gap-3 flex-1"
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
              {chat.lastMessage || ''}
            </div>
          </div>
        </div>
        {!chat.isGroup && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => {
                  setCurrentChat(chat);
                  setDeleteType('friend');
                  setShowDeleteAlert(true);
                }}
                className="text-destructive"
              >
                Remove Friend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const handleCall = (isVideo: boolean) => {
    if (!currentChat) return;
    const otherUserId = currentChat.participants.find(id => id !== user?.uid);
    if (otherUserId) {
      callUser(otherUserId, isVideo);
    }
  };

  const endCall = () => {
    setIsCalling(false);
    setOtherParticipant(null);
    setIsVideo(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sol Sidebar - Kontaklar */}
      <div className={`
        w-full md:w-80 flex flex-col border-r border-border
        ${currentChat ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="p-4 border-b border-border shrink-0">
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
        <div className="p-2 space-y-2 shrink-0">
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
        <div className="overflow-y-auto flex-1">
          {userChats.map(renderChatItem)}
          {userChats.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              No chats yet. Add friends to start chatting!
            </div>
          )}
        </div>
      </div>

      {/* Ana Chat Alanı */}
      <div className={`
        flex-1 flex flex-col overflow-hidden
        ${currentChat ? 'flex' : 'hidden md:flex'}
      `}>
        {currentChat ? (
          <>
            <div className="p-4 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setCurrentChat(undefined)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={currentChat.isGroup ? currentChat.groupPhoto || undefined : otherParticipant?.photoURL || undefined} />
                  <AvatarFallback>
                    {currentChat.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      otherParticipant?.displayName?.[0] || 'U'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {currentChat.isGroup 
                      ? currentChat.groupName 
                      : otherParticipant?.displayName
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentChat.isGroup 
                      ? `${currentChat.participants.length} members`
                      : ''
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCall(false)}
                  disabled={currentChat.isGroup}
                >
                  <PhoneCall className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleCall(true)}
                  disabled={currentChat.isGroup}
                >
                  <Video className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setDeleteType('messages');
                      setShowDeleteAlert(true);
                    }}>
                      Delete Messages
                    </DropdownMenuItem>
                    {!currentChat.isGroup && (
                      <DropdownMenuItem onClick={() => {
                        setDeleteType('friend');
                        setShowDeleteAlert(true);
                      }}>
                        Remove Friend
                      </DropdownMenuItem>
                    )}
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
                    className={`max-w-[70%] md:max-w-[50%] rounded-lg p-3 ${
                      msg.senderId === user?.uid
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
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
              className="p-4 border-t border-border bg-background shrink-0"
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

      {/* Arama Bildirimi */}
      {isCalling && (
        <div className="fixed top-4 right-4 bg-background border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              {isVideo ? (
                <Video className="h-6 w-6 text-primary" />
              ) : (
                <Phone className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">Calling...</p>
              <p className="text-sm text-muted-foreground">
                {otherParticipant?.displayName}
              </p>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="ml-2"
              onClick={endCall}
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Profil Ayarları */}
      <ProfileSettings 
        open={showProfileSettings}
        onOpenChange={setShowProfileSettings}
      />

      {/* Grup Oluşturma Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group chat by selecting members and giving it a name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name..."
              />
            </div>
            <div>
              <Label>Add Members</Label>
              <div className="mt-2 max-h-[200px] overflow-y-auto space-y-2">
                {userChats
                  .filter(chat => !chat.isGroup)
                  .map((chat) => {
                    const otherParticipant = getOtherParticipant(chat);
                    return (
                      <div
                        key={chat.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                      >
                        <Checkbox
                          id={`member-${chat.id}`}
                          checked={selectedContacts.includes(
                            chat.participants.find(id => id !== user?.uid) || ''
                          )}
                          onCheckedChange={(checked) => {
                            const otherId = chat.participants.find(id => id !== user?.uid);
                            if (otherId) {
                              if (checked) {
                                setSelectedContacts([...selectedContacts, otherId]);
                              } else {
                                setSelectedContacts(
                                  selectedContacts.filter(id => id !== otherId)
                                );
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor={`member-${chat.id}`}
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={otherParticipant?.photoURL || undefined} />
                            <AvatarFallback>
                              {otherParticipant?.displayName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{otherParticipant?.displayName}</span>
                        </label>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName || selectedContacts.length === 0}>
              Create Group
            </Button>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === 'messages' ? 'Delete Messages' : 'Remove Friend'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === 'messages'
                ? 'This will delete all messages in this chat. This action cannot be undone.'
                : 'This will remove this friend and delete all messages. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteType === 'messages' ? handleDeleteMessages : handleDeleteFriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Call Interface */}
      {(call.isReceivingCall || callAccepted) && <CallInterface />}
    </div>
  );
} 