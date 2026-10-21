"use client";

import { useState, useEffect } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number = 50): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}