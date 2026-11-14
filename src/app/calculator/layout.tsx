import type { ReactNode } from "react";
import { SmallScreenGate } from "@/components/layout/small-screen-gate";

export default function CalculatorLayout({ children }: { children: ReactNode }) {
  return <SmallScreenGate>{children}</SmallScreenGate>;
}
