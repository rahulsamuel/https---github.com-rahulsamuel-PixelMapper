import type { ReactNode } from "react";
import { SmallScreenGate } from "@/components/layout/small-screen-gate";
import { RequireAuth } from "@/components/auth/require-auth";

export default function PreVisualLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <SmallScreenGate>{children}</SmallScreenGate>
    </RequireAuth>
  );
}
