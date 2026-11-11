"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectMismatchDialogProps {
  open: boolean;
  onBackToList: () => void;
  onClose: () => void;
}

export function ProjectMismatchDialog({ open, onBackToList, onClose }: ProjectMismatchDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={next => { if (!next) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>This project was changed elsewhere</AlertDialogTitle>
          <AlertDialogDescription>
            The project you are working on is no longer the one selected in this window, so nothing was saved.
            Go back to the project list and open the project again to continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Close</AlertDialogCancel>
          <AlertDialogAction onClick={onBackToList}>Back to project list</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
