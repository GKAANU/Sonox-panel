"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

interface FormData {
  email: string;
  password: string;
  name: string;
}

const errorMessages: { [key: string]: string } = {
  "auth/popup-closed-by-user": "Sign in cancelled. Please try again when you're ready!",
  "auth/user-not-found": "No account found with this email. Please check your email or sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "This email is already registered. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters long.",
};

export default function AuthPage() {
  console.log("auth page");
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    name: "",
  });

  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setLoading(true);
      await signInWithGoogle();
      router.push("/chat");
    } catch (error: any) {
      console.error("Google sign in error:", error);
      const errorCode = error.code;
      setError(errorMessages[errorCode] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin && (!formData.email || !formData.password)) {
      setError("Please fill in all fields");
      return;
    }
    if (!isLogin && (!formData.email || !formData.password || !formData.name)) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setError("");
      setLoading(true);
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.name);
      }
      router.push("/chat");
    } catch (error: any) {
      console.error("Auth error:", error);
      const errorCode = error.code;
      setError(errorMessages[errorCode] || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none" />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0, 0.71, 0.2, 1.01],
        }}
        className="w-full max-w-[400px] mx-4 relative z-10"
      >
        <Card className="border-2 border-primary/10 bg-background/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-2"
            >
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/60 blur-lg opacity-50" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center p-2">
                  <Image
                    src="/sonox.png"
                    alt="Sonox Logo"
                    width={80}
                    height={80}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text text-transparent mt-6">
                Welcome to Sonox
              </CardTitle>
              <CardDescription className="text-lg font-medium pt-2 text-muted-foreground">
                {isLogin ? "Sign in to continue chatting" : "Create your Sonox account"}
              </CardDescription>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-6">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="name" className="text-sm font-medium text-foreground/90">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="bg-background/50 border-primary/10 focus:border-primary/30 h-11"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="bg-background/50 border-primary/10 focus:border-primary/30 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="bg-background/50 border-primary/10 focus:border-primary/30 h-11"
                />
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium h-11 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
                    </div>
                  ) : (
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/80 backdrop-blur-xl px-2 text-muted-foreground font-medium">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full border-primary/10 bg-background/50 hover:bg-background/80 font-medium h-11 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                >
                  <FcGoogle className="w-5 h-5 mr-2" />
                  Sign in with Google
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary hover:text-primary/90 hover:underline transition-colors font-medium"
                  >
                    {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 