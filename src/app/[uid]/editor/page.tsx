
'use server';

import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { PixelMapProvider } from "@/contexts/pixel-map-context";
import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { redirect } from "next/navigation";

export default async function EditorPage({ params }: { params: { uid: string } }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (user.uid !== params.uid) {
    redirect(`/${user.uid}/editor`);
  }
  
  return (
    <PixelMapProvider>
      <PixelMapLayout />
    </PixelMapProvider>
  );
}
