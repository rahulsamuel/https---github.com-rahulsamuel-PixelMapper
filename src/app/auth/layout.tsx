
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
        <div className="flex items-center justify-center min-h-screen bg-background">
            {children}
        </div>
    </AuthProvider>
  )
}
