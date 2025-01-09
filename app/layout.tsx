import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { FriendProvider } from "@/contexts/FriendContext";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sonox Chat",
  description: "Real-time chat application with video calls",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <FriendProvider>
              <ChatProvider>
                <Toaster richColors position="top-right" />
                {children}
              </ChatProvider>
            </FriendProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 