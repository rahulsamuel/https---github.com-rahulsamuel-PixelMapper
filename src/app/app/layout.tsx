import { PixelMapperProvider } from "@/contexts/pixel-mapper-context";
import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PixelMapperProvider>
        {children}
    </PixelMapperProvider>
  )
}
