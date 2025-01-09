"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FcGoogle } from "react-icons/fc";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthPage() {
  const router = useRouter();

  const handleGoogleSignIn = () => {
    // Google sign in işlemi burada yapılacak
    console.log("Google sign in clicked");
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    // Sign in işlemi burada yapılacak
    router.push("/chat");
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Sign up işlemi burada yapılacak
    router.push("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Sonox</CardTitle>
          <CardDescription>Sign in to your account or create a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" placeholder="Enter your email" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" placeholder="Enter your password" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <Button type="submit">Sign In</Button>
                  <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="gap-2">
                    <FcGoogle className="w-5 h-5" />
                    Sign in with Google
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input id="signup-name" placeholder="Enter your name" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" placeholder="Enter your email" />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <Button type="submit">Sign Up</Button>
                  <Button variant="outline" type="button" onClick={handleGoogleSignIn} className="gap-2">
                    <FcGoogle className="w-5 h-5" />
                    Sign up with Google
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 