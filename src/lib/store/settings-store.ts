"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  anthropicApiKey: string;
  setAnthropicApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      anthropicApiKey: "",
      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),
    }),
    { name: "interview-assistant-settings" }
  )
);
