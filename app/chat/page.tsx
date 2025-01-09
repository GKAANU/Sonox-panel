"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
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
  Plus
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC bağlantısı için gerekli state'ler
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

  // Örnek veri
  const contacts = [
    { id: 1, name: "John Doe", status: "online", avatar: "/avatars/1.png" },
    { id: 2, name: "Jane Smith", status: "offline", avatar: "/avatars/2.png" },
    { id: 3, name: "Development Team", type: "group", members: 5, avatar: "/avatars/group1.png" },
  ];

  const messages = [
    { id: 1, sender: "John Doe", content: "Hey, how are you?", time: "10:30 AM" },
    { id: 2, sender: "You", content: "I'm good, thanks! How about you?", time: "10:31 AM" },
  ];

  // WebRTC bağlantısını başlat
  const startCall = async (withVideo: boolean = false) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // WebRTC bağlantısını kur
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      setIsCallActive(true);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  // Ekran paylaşımını başlat
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsScreenSharing(true);
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  // Grup oluştur
  const createGroup = () => {
    setShowGroupDialog(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sol Sidebar - Kontaklar */}
      <div className="w-80 border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Avatar>
              <AvatarImage src="/avatars/user.png" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" className="pl-8" />
          </div>
        </div>
        <div className="p-2">
          <Button variant="outline" className="w-full" onClick={createGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-12rem)]">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-4 hover:bg-accent cursor-pointer"
            >
              <Avatar>
                <AvatarImage src={contact.avatar} />
                <AvatarFallback>
                  {contact.type === "group" ? <Users className="h-4 w-4" /> : contact.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{contact.name}</div>
                <div className="text-sm text-muted-foreground">
                  {contact.type === "group" 
                    ? `${contact.members} members`
                    : contact.status
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ana Chat Alanı */}
      <div className="flex-1 flex flex-col">
        {/* Chat Başlığı */}
        <div className="p-4 border-b border-border bg-background flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatars/1.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">John Doe</div>
              <div className="text-sm text-muted-foreground">Online</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => startCall(false)}>
              <PhoneCall className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => startCall(true)}>
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
                <DropdownMenuItem onClick={startScreenShare}>
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

        {/* Aktif Çağrı */}
        {isCallActive && (
          <div className="relative h-[300px] bg-accent">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="absolute bottom-4 right-4 w-[200px] h-[150px] object-cover rounded-lg border border-border"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                variant={isAudioEnabled ? "outline" : "destructive"}
                size="icon"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              >
                {isAudioEnabled ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant={isVideoEnabled ? "outline" : "destructive"}
                size="icon"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsCallActive(false)}
              >
                End Call
              </Button>
            </div>
          </div>
        )}

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "You" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender === "You"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className="text-xs mt-1 opacity-70">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mesaj Gönderme */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

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
              <Input placeholder="Enter group name" />
            </div>
            <div>
              <Label>Add Members</Label>
              <div className="mt-2 space-y-2">
                {contacts
                  .filter((contact) => contact.type !== "group")
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                    >
                      <Checkbox id={`member-${contact.id}`} />
                      <label
                        htmlFor={`member-${contact.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback>{contact.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{contact.name}</span>
                      </label>
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
                Cancel
              </Button>
              <Button>Create Group</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 