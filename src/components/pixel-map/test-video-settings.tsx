"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { TestVideoPresetSettings } from "@/lib/test-video-presets";

export const DEFAULT_TEST_VIDEO_SETTINGS: TestVideoPresetSettings = {
  resolution: "1080p",
  frameRate: 30,
  durationSeconds: 10,
  background: "smpte-bars",
  bars: "none",
  barWidth: 8,
  audioEnabled: true,
  sampleRate: 48000,
  videoCodec: "h264-high",
};

interface TestVideoSettingsContextValue {
  settings: TestVideoPresetSettings;
  setSettings: React.Dispatch<React.SetStateAction<TestVideoPresetSettings>>;
}

const TestVideoSettingsContext = createContext<TestVideoSettingsContextValue | null>(null);

export function TestVideoSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULT_TEST_VIDEO_SETTINGS);
  const value = useMemo(() => ({ settings, setSettings }), [settings]);
  return <TestVideoSettingsContext.Provider value={value}>{children}</TestVideoSettingsContext.Provider>;
}

export function useTestVideoSettings() {
  const value = useContext(TestVideoSettingsContext);
  if (!value) throw new Error("Test video settings must be used within its provider.");
  return value;
}
