import type { ReactNode } from "react";
import { SmallScreenGate } from "@/components/layout/small-screen-gate";
import { RequireAuth } from "@/components/auth/require-auth";

export default function SignalFlowLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <SmallScreenGate>{children}</SmallScreenGate>
    </RequireAuth>
  );
}
