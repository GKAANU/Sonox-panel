"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>, type: 'login' | 'register') {
    event.preventDefault();
    setIsLoading(true);

    // Handle auth operations here
    // Example: API call

    setTimeout(() => {
      setIsLoading(false);
      if (type === 'login') {
        router.push("/chat");
      } else {
        router.push("/?tab=login");
      }
    }, 1000);
  }

  async function handleGoogleAuth() {
    setIsLoading(true);
    // Handle Google auth here
    setTimeout(() => {
      setIsLoading(false);
      router.push("/chat");
    }, 1000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Welcome to Sonox Chat
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account or create a new one
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="grid gap-6">
                <form onSubmit={(e) => onSubmit(e, 'login')}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoCapitalize="none"
                        autoComplete="current-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button className="mt-2" disabled={isLoading}>
                      {isLoading && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      Sign In
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="register">
              <div className="grid gap-6">
                <form onSubmit={(e) => onSubmit(e, 'register')}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        autoCapitalize="none"
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button className="mt-2" disabled={isLoading}>
                      {isLoading && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      )}
                      Sign Up
                    </Button>
                  </div>
                </form>
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={handleGoogleAuth}
            className="w-full mt-6"
          >
            {isLoading ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <FcGoogle className="mr-2 h-5 w-5" />
            )}
            Sign up with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 