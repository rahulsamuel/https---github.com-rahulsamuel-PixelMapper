
import { PixelMapLayout } from "@/components/pixel-map/pixel-map-layout";
import { CollaborationWrapper } from "@/components/pixel-map/collaboration-wrapper";
import { PixelMapProvider } from "@/contexts/pixel-map-context";

export default function AppPage() {
  return (
    <div className="h-[calc(100svh-3.5rem)] overflow-hidden">
      <PixelMapProvider>
        <CollaborationWrapper />
      </PixelMapProvider>
    </div>
  );
}
