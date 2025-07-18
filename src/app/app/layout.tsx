
import { PixelMapProvider } from "@/contexts/pixel-map-context";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PixelMapProvider>
        {children}
    </PixelMapProvider>
  )
}
