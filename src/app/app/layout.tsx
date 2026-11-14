import type { ReactNode } from "react";
import { SmallScreenGate } from "@/components/layout/small-screen-gate";

export default function PixelMapLayout({ children }: { children: ReactNode }) {
  return <SmallScreenGate>{children}</SmallScreenGate>;
}
