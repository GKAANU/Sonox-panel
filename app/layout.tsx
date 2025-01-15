import "./globals.css";
import { ClientLayout } from "./client-layout";
import type { Metadata } from "next";

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
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
} 