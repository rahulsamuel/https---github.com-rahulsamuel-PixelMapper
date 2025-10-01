
'use client';

import { AppHeader } from "@/components/app/app-header";
import type { ReactNode } from "react";

export default function AddLedLayout({ children }: { children: ReactNode }) {
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
