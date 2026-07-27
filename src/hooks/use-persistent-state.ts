'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        setState(JSON.parse(raw) as T);
      }
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full or unavailable — silently ignore
    }
  }, [key, state, loaded]);

  return [state, setState];
}
