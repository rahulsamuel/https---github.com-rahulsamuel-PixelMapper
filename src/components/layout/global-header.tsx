'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";

export function GlobalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-14 items-center px-4 gap-3">
      <SidebarTrigger />
    </header>
  );
}
