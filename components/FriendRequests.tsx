"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFriend } from "@/contexts/FriendContext";
import { Check, X, UserPlus, Search } from "lucide-react";
import { Label } from "@/components/ui/label";

export function FriendRequests() {
  const { friendRequests, searchUsers, searchUserById, sendFriendRequest, acceptFriendRequest, rejectFriendRequest } = useFriend();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"name" | "id">("name");
  const [error, setError] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError("");
      
      if (searchType === "id") {
        const user = await searchUserById(searchQuery.trim());
        setSearchResults(user ? [user] : []);
        if (!user) {
          setError("User not found");
        }
      } else {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        if (results.length === 0) {
          setError("No users found");
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      setLoading(true);
      await sendFriendRequest(userId);
      setSentRequests(prev => new Set([...prev, userId]));
    } catch (error: any) {
      console.error('Send request error:', error);
      setError(error.message || "Failed to send friend request");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await acceptFriendRequest(requestId);
      // Request will be automatically removed from the list due to the Firebase listener
    } catch (error: any) {
      console.error('Accept request error:', error);
      setError(error.message || "Failed to accept friend request");
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant={searchType === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("name")}
              className="hover:opacity-90 transition-opacity"
            >
              Search by Name
            </Button>
            <Button
              variant={searchType === "id" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("id")}
              className="hover:opacity-90 transition-opacity"
            >
              Search by ID
            </Button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label>
                {searchType === "id" ? "Enter User ID" : "Search by Name"}
              </Label>
              <Input
                placeholder={searchType === "id" ? "Enter user ID..." : "Search users..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="self-end hover:opacity-90 transition-opacity"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <ScrollArea className="h-[300px]">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
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
                disabled={loading || sentRequests.has(user.id)}
                className={`transition-all duration-200 ${
                  sentRequests.has(user.id)
                    ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
              >
                {sentRequests.has(user.id) ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
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
              className="flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={request.senderPhoto || undefined} />
                  <AvatarFallback>{request.senderName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="font-medium">{request.senderName}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleAcceptRequest(request.id)}
                  disabled={loading}
                  className="hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => rejectFriendRequest(request.id)}
                  disabled={loading}
                  className="hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
          {friendRequests.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              No pending friend requests
            </div>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
} 