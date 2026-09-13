import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={showText ? "/MapMyLED_wordmark_transparent copy 3.png" : "/MapMyLED_app_icon copy 2.png"}
        alt="MapMyLED"
        width={showText ? 525 : 48}
        height={showText ? 141 : 48}
        priority
        className={cn("h-full w-auto object-contain", !showText && "rounded-md")}
      />
    </span>
  );
}
