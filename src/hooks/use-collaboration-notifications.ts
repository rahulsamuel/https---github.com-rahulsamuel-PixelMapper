"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export function useCollaborationNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const knownInvitationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("collaboration-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_collaborators",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRecord = payload.new as { project_id: string; user_id: string; id: string };

          if (knownInvitationsRef.current.has(newRecord.id)) return;
          knownInvitationsRef.current.add(newRecord.id);

          const { data: projectData } = await supabase
            .from("pixel_map_projects")
            .select("project_name, users!inner (email)")
            .eq("id", newRecord.project_id)
            .maybeSingle();

          const projectName = (projectData as any)?.project_name ?? "a project";
          const ownerEmail = (projectData as any)?.users?.email ?? "Someone";

          toast({
            title: "Project Shared With You",
            description: `${ownerEmail} shared "${projectName}" with you. Open the project switcher to start collaborating.`,
            duration: 8000,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_collaborators",
        },
        async (payload) => {
          const newRecord = payload.new as { project_id: string; user_id: string; id: string };

          if (newRecord.user_id !== user.id) {
            const { data: collabData } = await supabase
              .from("project_collaborators")
              .select("user_id, users!inner (email)")
              .eq("project_id", newRecord.project_id)
              .eq("user_id", newRecord.user_id)
              .maybeSingle();

            const inviteeEmail = (collabData as any)?.users?.email ?? "Someone";

            toast({
              title: "Collaborator Joined",
              description: `${inviteeEmail} can now edit this project.`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
}
