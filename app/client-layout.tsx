'use client';

import { Providers } from "@/components/providers";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
} 