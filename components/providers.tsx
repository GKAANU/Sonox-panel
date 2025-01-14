"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { CallProvider } from "@/contexts/CallContext";
import { FriendProvider } from "@/contexts/FriendContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <FriendProvider>
          <ChatProvider>
            <CallProvider>
              {children}
              <Toaster position="top-center" expand={true} richColors />
            </CallProvider>
          </ChatProvider>
        </FriendProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
