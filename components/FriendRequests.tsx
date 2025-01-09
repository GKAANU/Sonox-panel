"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriend } from "@/contexts/FriendContext";
import { Check, X, UserPlus, Search } from "lucide-react";

export function FriendRequests() {
  const { friendRequests, friends, searchUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriend();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      setLoading(true);
      await sendFriendRequest(userId);
    } catch (error) {
      console.error('Send request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultValue="search" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="search">Search</TabsTrigger>
        <TabsTrigger value="requests">
          Requests
          {friendRequests.length > 0 && (
            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {friendRequests.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="search" className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[300px]">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSendRequest(user.id)}
                disabled={loading}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="requests">
        <ScrollArea className="h-[300px]">
          {friendRequests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-2 hover:bg-accent rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={request.senderPhoto || undefined} />
                  <AvatarFallback>{request.senderName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{request.senderName}</div>
                  <div className="text-sm text-muted-foreground">
                    Sent {new Date(request.timestamp?.toDate()).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => acceptFriendRequest(request.id)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => rejectFriendRequest(request.id)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {friendRequests.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              No friend requests
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
} 