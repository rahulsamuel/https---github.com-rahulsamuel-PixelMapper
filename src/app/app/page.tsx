import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { redirect } from 'next/navigation';
import { auth } from '@/firebase/server';

export default async function AppPage() {
  const { currentUser } = auth;

  if (!currentUser) {
    redirect('/auth/signin');
  }

  return (
      <PixelMapLayout />
  );
}
