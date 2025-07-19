
import { LandingPage } from "@/components/landing/landing-page";
import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    return <PixelMapLayout />;
  }

  return (
    <LandingPage />
  );
}
