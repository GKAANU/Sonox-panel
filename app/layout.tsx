import "./globals.css";
import { Providers } from "@/components/providers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sonox Chat",
  description: "A modern chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 