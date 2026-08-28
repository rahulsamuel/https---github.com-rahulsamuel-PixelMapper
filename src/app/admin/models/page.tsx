"use client";

import { useState, useRef, useEffect } from "react";
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
import { Upload, Trash2, FileBox, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
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

const CATEGORIES = [
  { value: "tile", label: "Tile / Panel" },
  { value: "hardware", label: "Hardware / Rigging" },
  { value: "processor", label: "Processor / Controller" },
  { value: "misc", label: "Miscellaneous" },
];

const ACCEPTED_TYPES = ".glb,.gltf,.obj,.fbx,.stl,.step,.stp,.png,.jpg,.jpeg";

export default function AdminModelsPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("tile");
  const [loadingModels, setLoadingModels] = useState(true);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("pre_visual_models")
          .select("*")
          .order("uploaded_at", { ascending: false });
        if (error) throw error;
        if (data) {
          setModels(
            data.map((m: Record<string, unknown>) => ({
              id: m.id as string,
              name: m.name as string,
              category: m.category as string,
              fileUrl: m.file_url as string,
              fileName: m.file_name as string,
              fileSize: m.file_size as number,
              uploadedAt: m.uploaded_at as string,
            }))
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load models");
      } finally {
        setLoadingModels(false);
      }
    })();
  }, [isAdmin, authLoading]);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
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

      setModels([
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
      setError(err instanceof Error ? err.message : "Upload failed");
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
      setModels(models.filter(m => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldCheck className="h-5 w-5" />
          <p>Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBox className="h-6 w-6" />
          3D Model Library
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload 3D model files (GLB, GLTF, OBJ, FBX, STL, STEP, PNG, JPG) for the Pre-Visual viewer.
          These are shared across all users.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload form */}
      <div className="border rounded-lg p-4 mb-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upload New Model</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Model Name</Label>
            <Input
              placeholder="e.g. ROE Black Pearl CB2"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button
          variant="outline"
          className="w-full"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Select File to Upload
            </>
          )}
        </Button>
      </div>

      {/* Model list */}
      <div className="border rounded-lg">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-medium">Uploaded Models ({models.length})</p>
        </div>
        <ScrollArea className="h-[50vh]">
          <div className="p-2 space-y-1">
            {loadingModels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No models uploaded yet.</p>
            ) : (
              models.map(m => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.fileName} · {formatSize(m.fileSize)}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-medium",
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
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
