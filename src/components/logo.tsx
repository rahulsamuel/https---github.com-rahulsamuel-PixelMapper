import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/MapMyLED_app_icon copy 2.png"
        alt=""
        width={48}
        height={48}
        priority
        className="h-full w-auto shrink-0 rounded-md object-contain"
      />
      {showText && (
        <Image
          src="/MapMyLED_wordmark_transparent copy 3.png"
          alt="MapMyLED"
          width={525}
          height={141}
          priority
          className="h-full w-auto object-contain"
        />
      )}
    </span>
  );
}
