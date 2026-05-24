"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  deepseekModel: string;
  setDeepseekApiKey: (key: string) => void;
  setDeepseekBaseUrl: (url: string) => void;
  setDeepseekModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      deepseekApiKey: "sk-7bb184da35804f1189f3a7ad3bd91279",
      deepseekBaseUrl: "https://api.deepseek.com",
      deepseekModel: "deepseek-v4-flash",
      setDeepseekApiKey: (key) => set({ deepseekApiKey: key }),
      setDeepseekBaseUrl: (url) => set({ deepseekBaseUrl: url }),
      setDeepseekModel: (model) => set({ deepseekModel: model }),
    }),
    { name: "interview-assistant-settings-v2" }
  )
);
