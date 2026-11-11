"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface SaveActivityValue {
  isSaving: boolean;
  trackSave: <T>(task: () => Promise<T>) => Promise<T>;
}

const SaveActivityContext = createContext<SaveActivityValue | null>(null);

export function SaveActivityProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);

  const trackSave = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    setPendingCount((n) => n + 1);
    try {
      return await task();
    } finally {
      setPendingCount((n) => n - 1);
    }
  }, []);

  const value = useMemo(() => ({ isSaving: pendingCount > 0, trackSave }), [pendingCount, trackSave]);

  return <SaveActivityContext.Provider value={value}>{children}</SaveActivityContext.Provider>;
}

export function useSaveActivity(): SaveActivityValue {
  const value = useContext(SaveActivityContext);
  if (!value) throw new Error("useSaveActivity must be used within a SaveActivityProvider");
  return value;
}
