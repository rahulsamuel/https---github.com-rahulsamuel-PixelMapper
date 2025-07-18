
import { LandingPage } from "@/components/landing/landing-page";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const userCookie = cookies().get('user');

  if (userCookie) {
    redirect('/app');
  }

  return (
    <LandingPage />
  );
}
