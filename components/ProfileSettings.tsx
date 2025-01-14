"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { toast } from "sonner";

export function ProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    try {
      setLoading(true);
      const file = e.target.files[0];
      const storageRef = ref(storage, `profile-photos/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      toast.success("Profile photo updated successfully");
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="w-24 h-24">
            <AvatarImage src={user?.photoURL || ""} />
            <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
          </Avatar>
          <Label
            htmlFor="photo-upload"
            className="absolute bottom-0 right-0 p-1 bg-background border rounded-full cursor-pointer hover:bg-accent transition-colors"
          >
            <Camera className="w-4 h-4" />
            <Input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={loading}
            />
          </Label>
        </div>
        <div className="text-center">
          <h2 className="font-semibold text-lg">{user?.displayName}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
    </div>
  );
} 