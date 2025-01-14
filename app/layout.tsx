"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { CallProvider } from "@/contexts/CallContext";
import { FriendProvider } from "@/contexts/FriendContext";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Sonox Chat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
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
      </body>
    </html>
  );
} 