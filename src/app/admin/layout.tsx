
'use client';

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();

    // useEffect(() => {
    //     if (user === null) {
    //         router.push('/login');
    //     }
    // }, [user, router]);

    // if (!user) {
    //     return (
    //         <div className="flex flex-col min-h-screen bg-background">
    //             <AppHeader />
    //             <main className="flex-1 flex items-center justify-center">
    //                 <p>Redirecting to login...</p>
    //             </main>
    //         </div>
    //     );
    // }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
