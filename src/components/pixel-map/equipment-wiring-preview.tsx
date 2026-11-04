"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cable } from "lucide-react";
import { usePixelMap, type CableRun } from "@/contexts/pixel-map-context";
import { WiringDiagram } from "./wiring-diagram";

const WIRING_PREVIEWS = [
  { value: "data", label: "Data", kind: "cat" as const },
  { value: "power", label: "Power", kind: "power" as const },
];

const toMeters = (c: CableRun) => (c.unit === "ft" ? c.length * 0.3048 : c.length);

function RunSummary({ cables }: { cables: CableRun[] }) {
  const totalM = cables.reduce((sum, c) => sum + toMeters(c), 0);
  return (
    <p className="text-sm text-muted-foreground">
      {cables.length} runs · {totalM.toFixed(1)} m total ({(totalM * 3.28084).toFixed(0)} ft)
    </p>
  );
}

export function EquipmentWiringPreview({ cables }: { cables: CableRun[] }) {
  const { currentScreen } = usePixelMap();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Wiring Preview</CardTitle>
        <p className="text-sm text-muted-foreground">Screen: {currentScreen.name}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="data" className="space-y-4">
          <TabsList>
            {WIRING_PREVIEWS.map(p => <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>)}
          </TabsList>
          {WIRING_PREVIEWS.map(p => (
            <TabsContent key={p.value} value={p.value} className="space-y-4">
              <div className="overflow-auto rounded-md border bg-background p-2">
                <WiringDiagram layer={p.value as "data" | "power"} />
              </div>
              <RunSummary cables={cables.filter(c => c.kind === p.kind)} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
