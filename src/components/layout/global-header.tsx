'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const PAGE_TITLES: Record<string, string> = {
  '/': 'Home',
  '/app': 'Pixel Map',
  '/calculator': 'LED Calculator',
  '/power-data': 'Power & Data',
  '/rack-drawing': 'Rack Drawing',
  '/login': 'Login',
  '/admin/products': 'Admin — Products',
  '/admin/tracking': 'Admin — Tracking',
  '/admin/add-led': 'Admin — Add LED',
  '/add-led': 'Add LED Product',
  '/contact': 'Contact',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key) && key !== '/') return title;
  }
  return 'MapMyLED';
}

export function GlobalHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-14 items-center px-2 gap-2">
      <SidebarTrigger className="shrink-0" />
      <Separator orientation="vertical" className="h-5" />
      <span className="text-sm font-medium text-foreground/80">{title}</span>
    </header>
  );
}
