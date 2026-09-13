import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/MapMyLED_wordmark_transparent.png"
      alt="MapMyLED"
      width={495}
      height={92}
      priority
      className={cn("h-auto w-auto", className)}
    />
  );
}
