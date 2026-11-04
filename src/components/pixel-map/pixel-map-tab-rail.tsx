"use client";

import { useState } from "react";
import { LayoutGrid, Cable, Map as MapIcon, Server, Package, ChevronsLeft, ChevronsRight, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const VIEW_TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "grid", label: "LED Grid", icon: LayoutGrid },
  { value: "wiring", label: "Wiring Diagram", icon: Cable },
  { value: "raster", label: "Raster Map", icon: MapIcon },
  { value: "equipment", label: "Equipment", icon: Server },
  { value: "deliverables", label: "Deliverables", icon: Package },
];

interface TabRailProps {
  activeTab: string | null;
  onSelect: (tab: string) => void;
}

export function TabRail({ activeTab, onSelect }: TabRailProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Views"
        className={cn(
          "flex-shrink-0 flex flex-col gap-1 border-l bg-background py-2 transition-[width] duration-200 ease-out overflow-hidden",
          expanded ? "w-48 px-2" : "w-14 px-2 items-center"
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? "Collapse views menu" : "Expand views menu"}
          aria-expanded={expanded}
          className={cn(
            "flex items-center h-9 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground mb-1",
            expanded ? "w-full gap-3 px-3" : "w-10 justify-center"
          )}
        >
          {expanded ? <ChevronsRight className="h-4 w-4 shrink-0" /> : <ChevronsLeft className="h-4 w-4 shrink-0" />}
          {expanded && <span className="text-sm font-medium">Collapse</span>}
        </button>

        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          const button = (
            <button
              type="button"
              onClick={() => onSelect(tab.value)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center h-10 rounded-md text-sm font-medium transition-colors",
                expanded ? "w-full gap-3 px-3" : "w-10 justify-center",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">{tab.label}</span>}
            </button>
          );

          if (expanded) return <div key={tab.value}>{button}</div>;

          return (
            <Tooltip key={tab.value}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="left">{tab.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
