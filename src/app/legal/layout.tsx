'use client';

import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-[calc(100svh-3.5rem)]">
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {children}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MapMyLED. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Contact Us
          </Link>
        </nav>
      </footer>
    </div>
  );
}
