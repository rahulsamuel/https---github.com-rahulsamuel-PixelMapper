"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cable } from "lucide-react";
import type { CableRun } from "@/contexts/pixel-map-context";

const PREVIEW_BASE = "/assets/images/equipment-previews";

const WIRING_PREVIEWS = [
  { value: "data", label: "Data", kind: "cat" as const, image: `${PREVIEW_BASE}/DATA_WIRING_MAIN_10M_x_4M_FRONT_VIEW.png`, alt: "Data wiring preview" },
  { value: "power", label: "Power", kind: "power" as const, image: `${PREVIEW_BASE}/POWER_WIRING_MAIN_10M_x_4M_FRONT_VIEW.png`, alt: "Power wiring preview" },
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cable className="size-5" /> Wiring Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="data" className="space-y-4">
          <TabsList>
            {WIRING_PREVIEWS.map(p => <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>)}
          </TabsList>
          {WIRING_PREVIEWS.map(p => (
            <TabsContent key={p.value} value={p.value} className="space-y-4">
              <div className="overflow-x-auto rounded-md border bg-background">
                <img src={p.image} alt={p.alt} className="block w-full h-auto" />
              </div>
              <RunSummary cables={cables.filter(c => c.kind === p.kind)} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
