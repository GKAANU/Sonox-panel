"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-auth-pattern">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: [0, 0.71, 0.2, 1.01],
          scale: {
            type: "spring",
            damping: 10,
            stiffness: 100,
            restDelta: 0.001
          }
        }}
        className="w-full max-w-[400px] mx-4 relative z-10"
      >
        <Card className="relative overflow-hidden backdrop-blur-xl bg-background/40 shadow-2xl border-muted/30">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-secondary/5 to-accent/5" />
          
          <CardHeader className="space-y-4 text-center pb-8 relative">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <CardTitle className="text-4xl font-bold tracking-tight">
                <span className="inline-block bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </span>
              </CardTitle>
              <CardDescription className="text-lg font-medium text-muted-foreground pt-2">
                {isLogin ? "Great to see you again!" : "Join our community today"}
              </CardDescription>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-6 relative">
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
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={cn(
                        "h-11 bg-background/50 backdrop-blur-sm",
                        "border-muted-foreground/20 focus-visible:border-primary",
                        "transition-all duration-300"
                      )}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={cn(
                    "h-11 bg-background/50 backdrop-blur-sm",
                    "border-muted-foreground/20 focus-visible:border-primary",
                    "transition-all duration-300"
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                  className={cn(
                    "h-11 bg-background/50 backdrop-blur-sm",
                    "border-muted-foreground/20 focus-visible:border-primary",
                    "transition-all duration-300"
                  )}
                />
              </div>

              <div className="space-y-4 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full h-11 text-base font-medium",
                    "bg-gradient-to-r from-primary to-primary/80",
                    "hover:opacity-90 transition-all duration-300",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "shadow-lg shadow-primary/20"
                  )}
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
                    <span className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background/60 backdrop-blur-sm px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className={cn(
                    "w-full h-11 gap-2 text-base font-medium",
                    "bg-background/50 backdrop-blur-sm",
                    "border-muted-foreground/20",
                    "hover:bg-white/10 hover:border-muted-foreground/30",
                    "transition-all duration-300"
                  )}
                >
                  <FcGoogle className="w-5 h-5" />
                  <span>Continue with Google</span>
                </Button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFormData({ email: "", password: "", name: "" });
                  }}
                  className={cn(
                    "text-primary hover:underline font-medium",
                    "disabled:opacity-50 transition-opacity",
                    "focus:outline-none focus-visible:underline"
                  )}
                  disabled={loading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 