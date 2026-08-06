import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export type LogoPlacement =
  | "none"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export type BrandSettings = {
  profile: {
    name: string;
    photo: string;
  };
  company: {
    name: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
  imageStyle: {
    logoPlacement: LogoPlacement;
    notes: string;
  };
};

export const DEFAULT_SETTINGS: BrandSettings = {
  profile: { name: "", photo: "" },
  company: { name: "", logo: "", primaryColor: "#d8ff3e", secondaryColor: "#0a0b0c" },
  imageStyle: { logoPlacement: "bottom-right", notes: "" },
};

type SettingsContextValue = {
  settings: BrandSettings;
  saving: boolean;
  save: (next: BrandSettings) => Promise<{ error: string | null }>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function merge(raw: unknown): BrandSettings {
  const src = (raw ?? {}) as Partial<BrandSettings>;
  return {
    profile: { ...DEFAULT_SETTINGS.profile, ...(src.profile ?? {}) },
    company: { ...DEFAULT_SETTINGS.company, ...(src.company ?? {}) },
    imageStyle: { ...DEFAULT_SETTINGS.imageStyle, ...(src.imageStyle ?? {}) },
  };
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BrandSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  /* Hydrate from the current user's metadata whenever the user changes. Also
     pre-fill profile.name from the top-level `name` we saved at signup, so a
     first-time settings open shows their existing name. */
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      return;
    }
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const merged = merge(meta["brand"]);
    if (!merged.profile.name && typeof meta["name"] === "string") {
      merged.profile.name = meta["name"] as string;
    }
    setSettings(merged);
  }, [user]);

  const save: SettingsContextValue["save"] = async (next) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { brand: next, name: next.profile.name },
    });
    setSaving(false);
    if (error) return { error: error.message };
    setSettings(next);
    return { error: null };
  };

  return (
    <SettingsContext.Provider value={{ settings, saving, save }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
