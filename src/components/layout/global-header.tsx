'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/':                  { title: 'Home' },
  '/app':               { title: 'Pixel Map', subtitle: 'Design your LED layout' },
  '/calculator':        { title: 'LED Calculator', subtitle: 'Compute screen specifications' },
  '/power-data':        { title: 'Power & Data', subtitle: 'Circuit load analysis' },
  '/rack-drawing':      { title: 'Rack Drawing', subtitle: 'Equipment rack builder' },
  '/login':             { title: 'Login' },
  '/contact':           { title: 'Contact' },
  '/add-led':           { title: 'Add LED Product' },
  '/admin/products':    { title: 'Products', subtitle: 'Admin' },
  '/admin/tracking':    { title: 'Tracking', subtitle: 'Admin' },
  '/admin/add-led':     { title: 'Add LED Product', subtitle: 'Admin' },
};

function getPageMeta(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [key, meta] of Object.entries(PAGE_TITLES)) {
    if (key !== '/' && pathname.startsWith(key)) return meta;
  }
  return { title: 'MapMyLED' };
}

export function GlobalHeader() {
  const pathname = usePathname();
  const meta = getPageMeta(pathname);

  return (
    <header className={cn(
      "sticky top-0 z-50 flex h-14 items-center gap-3 px-3 border-b",
      "bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
      "transition-all duration-200"
    )}>
      <SidebarTrigger className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" />
      <Separator orientation="vertical" className="h-5 opacity-50" />
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">{meta.title}</span>
        {meta.subtitle && (
          <span className="text-xs text-muted-foreground hidden sm:inline truncate">{meta.subtitle}</span>
        )}
      </div>
    </header>
  );
}
