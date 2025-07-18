
import { PixelMapProvider } from "@/contexts/pixel-map-context";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <PixelMapProvider>
            {children}
        </PixelMapProvider>
      </ProtectedRoute>
    </AuthProvider>
  )
}
