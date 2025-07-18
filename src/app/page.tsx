
import { LandingPage } from "@/components/landing/landing-page";
import { auth } from "@/firebase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { currentUser } = auth;

  if (currentUser) {
    redirect('/app');
  }

  return (
    <LandingPage />
  );
}
