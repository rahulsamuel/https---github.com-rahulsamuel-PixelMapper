
'use client';

import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import { LogOut } from "lucide-react";

export function LogoutButton() {
    const handleLogout = async () => {
        await signOut();
    };

    return (
        <form action={handleLogout}>
            <Button type="submit" variant="outline">
                <LogOut className="mr-2" />
                Log Out
            </Button>
        </form>
    );
}
