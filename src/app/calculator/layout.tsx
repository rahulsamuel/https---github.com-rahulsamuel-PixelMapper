import type { ReactNode } from "react";

export default function CalculatorLayout({ children }: { children: ReactNode }) {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
