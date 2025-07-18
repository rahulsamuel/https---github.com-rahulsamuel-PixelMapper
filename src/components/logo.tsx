import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 50 30"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Row 1 */}
      <rect x="20" y="0" width="10" height="10" fill="#273a5e" />
      
      {/* Row 2 */}
      <rect x="10" y="10" width="10" height="10" fill="#273a5e" />
      <rect x="20" y="10" width="10" height="10" fill="#d1d9e6" />
      <rect x="30" y="10" width="10" height="10" fill="#273a5e" />
      
      {/* Row 3 */}
      <rect x="0" y="20" width="10" height="10" fill="#273a5e" />
      <rect x="10" y="20" width="10" height="10" fill="#d1d9e6" />
      <rect x="20" y="20" width="10" height="10" fill="#273a5e" />
      <rect x="30" y="20" width="10" height="10" fill="#d1d9e6" />
      <rect x="40" y="20" width="10" height="10" fill="#273a5e" />
    </svg>
  );
}
