
'use server';

import { LandingPage } from "@/components/landing/landing-page";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(`/${user.uid}`);
  }

  return (
    <LandingPage />
  );
}
