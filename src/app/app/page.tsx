import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { redirect } from 'next/navigation';
import { auth } from '@/firebase/server';
import { cookies } from 'next/headers';

export default async function AppPage() {
  const userCookie = cookies().get('user');
  
  if (!userCookie) {
    redirect('/auth/signin');
  }

  return (
      <PixelMapLayout />
  );
}
