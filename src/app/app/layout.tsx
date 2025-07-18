
import { PixelMapProvider } from "@/contexts/pixel-map-context";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PixelMapProvider>
          {children}
      </PixelMapProvider>
    </AuthProvider>
  )
}
