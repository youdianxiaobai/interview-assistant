import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export async function fetchProfiles(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").order("created_at");
  return data ?? [];
}

export async function createProfile(name: string, role: string): Promise<Profile> {
  const { data } = await supabase.from("profiles").insert({ name, role }).select().single();
  return data!;
}
