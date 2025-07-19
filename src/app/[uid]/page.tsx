
import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function AppPage({ params }: { params: { uid: string } }) {
  const user = await getAuthenticatedUser();

  if (!user || user.uid !== params.uid) {
    redirect('/auth/signin');
  }

  return (
      <PixelMapLayout />
  );
}
