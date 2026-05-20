"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/types";

interface UserState {
  currentUserId: string | null;
  profiles: Profile[];
  setCurrentUser: (id: string) => void;
  setProfiles: (profiles: Profile[]) => void;
  addProfile: (p: Profile) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: null,
      profiles: [],
      setCurrentUser: (id) => set({ currentUserId: id }),
      setProfiles: (profiles) => set({ profiles }),
      addProfile: (p) => set((s) => ({ profiles: [...s.profiles, p] })),
    }),
    { name: "interview-assistant-user" }
  )
);
