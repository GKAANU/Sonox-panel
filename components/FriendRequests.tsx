"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export function FriendRequests() {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userId.trim()) return;

    try {
      setLoading(true);

      // Check if user exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", userId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("User not found");
        return;
      }

      const friendDoc = querySnapshot.docs[0];
      const friendData = friendDoc.data();

      // Don't allow adding yourself
      if (friendData.uid === user.uid) {
        toast.error("You can't add yourself");
        return;
      }

      // Check if chat already exists
      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
      const chatSnapshot = await getDocs(chatQuery);
      
      const chatExists = chatSnapshot.docs.some(doc => {
        const data = doc.data();
        return data.participants.includes(friendData.uid);
      });

      if (chatExists) {
        toast.error("Chat already exists with this user");
        return;
      }

      // Create new chat
      await addDoc(collection(db, "chats"), {
        participants: [user.uid, friendData.uid],
        isGroup: false,
        participantDetails: {
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email
          },
          [friendData.uid]: {
            displayName: friendData.displayName,
            photoURL: friendData.photoURL,
            email: friendData.email
          }
        }
      });

      toast.success("Friend added successfully");
      setUserId("");
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Failed to add friend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Add friends using their User ID. You can find your ID in Profile Settings.
        </p>
      </div>

      <form onSubmit={handleAddFriend} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId" className="text-sm font-medium text-foreground/80">Friend's User ID</Label>
          <Input
            id="userId"
            placeholder="Enter friend's User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            className="bg-muted/30 border border-muted/50"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Adding Friend...</span>
            </div>
          ) : (
            "Add Friend"
          )}
        </Button>
      </form>
    </div>
  );
} 