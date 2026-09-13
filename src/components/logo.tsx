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
        className="h-6 w-6 shrink-0 rounded-md object-cover"
      />
      {showText && <span className="text-sm font-bold tracking-tight">MapMyLED</span>}
    </span>
  );
}
