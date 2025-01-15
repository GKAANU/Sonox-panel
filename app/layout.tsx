'use client';

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
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com https://*.kaanuzun.com wss://*.kaanuzun.com;
                  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com;
                  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                  img-src 'self' data: https://* blob:;
                  font-src 'self' https://fonts.gstatic.com;
                  connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebase.com https://*.firebaseapp.com wss://*.kaanuzun.com https://*.kaanuzun.com ws://localhost:* http://localhost:*;
                  frame-src 'self' https://*.firebaseapp.com;"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 