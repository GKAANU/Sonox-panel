"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { auth, storage } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function ProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;

    try {
      setLoading(true);
      await updateProfile(auth.currentUser!, {
        displayName: displayName.trim()
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      await updateProfile(auth.currentUser!, { photoURL });
      toast.success("Profile photo updated successfully");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setLoading(false);
    }
  };

  const copyUserId = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast.success("User ID copied to clipboard");
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent">Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-primary/20">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className="bg-primary/5 text-lg font-medium">
                {user?.displayName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="photo-upload" 
              className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={loading}
            />
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-sm font-medium text-foreground/80">User ID</Label>
              <div className="flex gap-2">
                <Input
                  id="userId"
                  value={user?.uid || ''}
                  readOnly
                  className="bg-muted/30 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyUserId}
                  className="shrink-0 border-muted/20 hover:bg-primary/5"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this ID with friends to connect</p>
            </div>

            <Separator className="my-4" />

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium text-foreground/80">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  className="bg-muted/30"
                  placeholder="Enter your display name"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg" 
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 