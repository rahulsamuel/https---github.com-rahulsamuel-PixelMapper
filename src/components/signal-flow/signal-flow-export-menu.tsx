"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SignalFlowExportFormat, SignalFlowExportMode } from "@/lib/signal-flow-download";

export interface SignalFlowExportJob {
  format: SignalFlowExportFormat;
  mode: SignalFlowExportMode;
}

interface SignalFlowExportMenuProps {
  disabled: boolean;
  exporting: SignalFlowExportJob | null;
  onExport: (format: SignalFlowExportFormat, mode: SignalFlowExportMode) => void;
}

const FORMAT_OPTIONS: { format: SignalFlowExportFormat; label: string }[] = [
  { format: "html", label: "HTML" },
  { format: "pdf", label: "PDF" },
  { format: "png", label: "PNG" },
];

const MODE_OPTIONS: { mode: SignalFlowExportMode; label: string }[] = [
  { mode: "color", label: "Color" },
  { mode: "mono", label: "No color" },
];

export function SignalFlowExportMenu({ disabled, exporting, onExport }: SignalFlowExportMenuProps) {
  return (
    <>
      {FORMAT_OPTIONS.map(({ format, label }) => (
        <DropdownMenu key={format}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {exporting?.format === format ? "Exporting…" : label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {MODE_OPTIONS.map((option) => (
              <DropdownMenuItem key={option.mode} onSelect={() => onExport(format, option.mode)}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </>
  );
}
