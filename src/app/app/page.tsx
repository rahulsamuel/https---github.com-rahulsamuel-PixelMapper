
'use server';

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function AppRedirectPage() {
    const user = await getAuthenticatedUser();
    if (user) {
        redirect(`/${user.uid}`);
    } else {
        redirect('/auth/signin');
    }
}
