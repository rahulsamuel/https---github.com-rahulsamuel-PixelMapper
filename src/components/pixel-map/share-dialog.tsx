"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Loader2, Users, Copy, Check } from "lucide-react";
import {
  inviteCollaborator,
  removeCollaborator,
  getCollaborators,
  getProjectOwner,
  type Collaborator,
} from "@/lib/collaboration";
import { useAuth } from "@/contexts/auth-context";

interface ShareDialogProps {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ projectId, open, onOpenChange }: ShareDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCollaborators = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    const [collabRes, ownerRes] = await Promise.all([
      getCollaborators(projectId),
      getProjectOwner(projectId),
    ]);
    setIsLoading(false);
    if (collabRes.error) {
      toast({ title: "Error", description: "Could not load collaborators.", variant: "destructive" });
    } else {
      setCollaborators(collabRes.data);
    }
    if (ownerRes.email) setOwnerEmail(ownerRes.email);
  }, [projectId, toast]);

  useEffect(() => {
    if (open && projectId) loadCollaborators();
  }, [open, projectId, loadCollaborators]);

  const handleInvite = async () => {
    if (!projectId || !inviteEmail.trim()) return;
    setIsInviting(true);
    const { success, error } = await inviteCollaborator(projectId, inviteEmail.trim());
    setIsInviting(false);
    if (!success) {
      toast({ title: "Invite Failed", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Collaborator Added", description: `${inviteEmail} can now edit this project.` });
    setInviteEmail("");
    loadCollaborators();
  };

  const handleRemove = async (collaboratorUserId: string, email: string) => {
    if (!projectId) return;
    const { success, error } = await removeCollaborator(projectId, collaboratorUserId);
    if (!success) {
      toast({ title: "Error", description: error, variant: "destructive" });
      return;
    }
    toast({ title: "Removed", description: `${email} is no longer a collaborator.` });
    setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorUserId));
  };

  const handleCopyLink = () => {
    if (!projectId) return;
    const url = `${window.location.origin}/app?project=${projectId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOwner = ownerEmail === user?.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Invite collaborators to edit this project in real time. Everyone sees each other&apos;s changes live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Copy link */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={projectId ? `${window.location.origin}/app?project=${projectId}` : ""}
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Invite by email */}
          {isOwner && (
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-xs text-muted-foreground">
                Invite by email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="collaborator@example.com"
                  className="text-sm"
                />
                <Button onClick={handleInvite} disabled={isInviting} size="sm" className="shrink-0">
                  {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Collaborator list */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              People with access
            </Label>
            <ScrollArea className="max-h-48 rounded-lg">
              <div className="space-y-1.5">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
                  </div>
                ) : (
                  <>
                    {ownerEmail && (
                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/15 text-primary">
                              {ownerEmail.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">{ownerEmail}</p>
                            <p className="text-xs text-muted-foreground">Owner</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Owner</Badge>
                      </div>
                    )}
                    {collaborators.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {c.email.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-tight">{c.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{c.role}</p>
                          </div>
                        </div>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(c.userId, c.email)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {!ownerEmail && collaborators.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No collaborators yet.
                      </p>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Separator() {
  return <div className="border-t" />;
}
