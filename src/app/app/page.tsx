
import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { PixelMapProvider } from "@/contexts/pixel-map-context";

export default function AppPage() {
  return (
    <PixelMapProvider>
      <PixelMapLayout />
    </PixelMapProvider>
  );
}
