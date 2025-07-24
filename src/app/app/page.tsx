
'use server';

import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { PixelMapProvider } from "@/contexts/pixel-map-context";

export default async function AppPage() {
  return (
    <PixelMapProvider>
      <PixelMapLayout />
    </PixelMapProvider>
  );
}
