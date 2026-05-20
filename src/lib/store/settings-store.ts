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
      deepseekApiKey: "",
      deepseekBaseUrl: "https://api.deepseek.com",
      deepseekModel: "deepseek-chat",
      setDeepseekApiKey: (key) => set({ deepseekApiKey: key }),
      setDeepseekBaseUrl: (url) => set({ deepseekBaseUrl: url }),
      setDeepseekModel: (model) => set({ deepseekModel: model }),
    }),
    { name: "interview-assistant-settings" }
  )
);
