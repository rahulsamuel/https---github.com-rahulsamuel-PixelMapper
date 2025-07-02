import { PixelMapperLayout } from "@/components/pixel-mapper/pixel-mapper-layout";
import { PixelMapperProvider } from "@/contexts/pixel-mapper-context";

export default function Home() {
  return (
    <PixelMapperProvider>
      <PixelMapperLayout />
    </PixelMapperProvider>
  );
}
