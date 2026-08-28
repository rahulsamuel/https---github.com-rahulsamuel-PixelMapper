"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Trash2, FileBox, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ModelEntry {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

interface Props {
  models: ModelEntry[];
  onModelsChange: (models: ModelEntry[]) => void;
}

const CATEGORIES = [
  { value: "tile", label: "Tile / Panel" },
  { value: "hardware", label: "Hardware / Rigging" },
  { value: "processor", label: "Processor / Controller" },
  { value: "misc", label: "Miscellaneous" },
];

const ACCEPTED_TYPES = ".glb,.gltf,.obj,.fbx,.stl,.step,.stp,.png,.jpg,.jpeg";

export function ModelLibrary({ models, onModelsChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tile");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fileId = crypto.randomUUID();
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${fileId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("pre-visual-models")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("pre-visual-models")
        .getPublicUrl(path);

      const entry = {
        id: fileId,
        name: name.trim() || file.name.replace(/\.[^.]+$/, ""),
        category,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from("pre_visual_models").insert(entry);
      if (dbError) throw dbError;

      onModelsChange([
        {
          id: entry.id,
          name: entry.name,
          category: entry.category,
          fileUrl: entry.file_url,
          fileName: entry.file_name,
          fileSize: entry.file_size,
          uploadedAt: entry.uploaded_at,
        },
        ...models,
      ]);
      setName("");
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const model = models.find(m => m.id === id);
    if (!model) return;
    try {
      const path = model.fileUrl.split("/pre-visual-models/").pop();
      if (path) {
        await supabase.storage.from("pre-visual-models").remove([path]);
      }
      await supabase.from("pre_visual_models").delete().eq("id", id);
      onModelsChange(models.filter(m => m.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block flex items-center gap-1.5">
        <FileBox className="h-3.5 w-3.5" /> 3D Model Library
      </Label>
      <p className="text-xs text-muted-foreground mb-3">
        Upload 3D model files (GLB, GLTF, OBJ, etc.) for exact tile and hardware representation.
      </p>

      {/* Upload form */}
      <div className="space-y-2 mb-4">
        <Input
          placeholder="Model name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-xs h-8"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload Model
            </>
          )}
        </Button>
      </div>

      {/* Model list */}
      <ScrollArea className="max-h-48 rounded border">
        <div className="p-2 space-y-1">
          {models.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No models uploaded yet.</p>
          ) : (
            models.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded p-2 hover:bg-muted/50 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {m.fileName} · {formatSize(m.fileSize)}
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                  m.category === "tile" && "bg-blue-500/15 text-blue-600",
                  m.category === "hardware" && "bg-amber-500/15 text-amber-600",
                  m.category === "processor" && "bg-emerald-500/15 text-emerald-600",
                  m.category === "misc" && "bg-neutral-500/15 text-neutral-600",
                )}>
                  {CATEGORIES.find(c => c.value === m.category)?.label ?? m.category}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(m.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
