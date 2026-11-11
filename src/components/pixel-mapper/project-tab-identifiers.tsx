"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  fetchTabIdentifiers,
  TAB_IDENTIFIER_LABELS,
  type TabIdentifiers,
  type TabKey,
} from "@/lib/project-tab-identifiers";

const TAB_ORDER: TabKey[] = ["power_data", "rack_drawing", "pre_visual", "signal_flow"];

export function ProjectTabIdentifiers({ projectId }: { projectId: string | null }) {
  const [open, setOpen] = useState(false);
  const [identifiers, setIdentifiers] = useState<TabIdentifiers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIdentifiers(null);
    if (!open || !projectId) return;
    let stale = false;
    setLoading(true);
    setError(null);
    fetchTabIdentifiers(projectId).then(({ data, error: fetchError }) => {
      if (stale) return;
      setLoading(false);
      if (fetchError || !data) {
        setError(fetchError ?? "Could not load tab identifiers.");
        return;
      }
      setIdentifiers(data);
    });
    return () => {
      stale = true;
    };
  }, [open, projectId]);

  const renderBody = () => {
    if (!projectId) {
      return <p className="text-xs text-muted-foreground">Save this project to the cloud to get tab identifiers.</p>;
    }
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading identifiers...
        </div>
      );
    }
    if (error) return <p className="text-xs text-destructive">{error}</p>;
    if (!identifiers) return null;
    return (
      <div className="rounded-md border bg-muted/30 overflow-hidden">
        {TAB_ORDER.map((tab) => {
          const value = identifiers[tab];
          return (
            <div
              key={tab}
              className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/30 last:border-0"
            >
              <span className="text-xs text-muted-foreground">{TAB_IDENTIFIER_LABELS[tab]}</span>
              {value ? (
                <span className="font-mono text-xs font-semibold select-all break-all">{value}</span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Not saved yet</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
        Tab identifiers
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>{renderBody()}</CollapsibleContent>
    </Collapsible>
  );
}
