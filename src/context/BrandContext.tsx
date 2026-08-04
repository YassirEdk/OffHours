import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/* Holds the brand assets that image generation uses: a logo or reference
   image, style keywords, and a primary colour. Persists to localStorage so a
   user only uploads their logo once per browser.

   The logo lives in state as a base64 data URL — small enough for one image
   (~100KB), never leaves the device except when it rides one image-gen call
   up to OpenAI. */

const LS_KEY = "offhours.brand.v1";

export type Brand = {
  /** Data URL: `data:image/png;base64,...` — a logo or brand reference image. */
  imageDataUrl: string | null;
  /** Free text: "minimalist, warm, industrial", "brutalist, high-contrast". */
  styleKeywords: string;
  /** Hex string for accent moments: "#0A84FF". Optional. */
  primaryColor: string;
};

const EMPTY_BRAND: Brand = {
  imageDataUrl: null,
  styleKeywords: "",
  primaryColor: "",
};

type BrandContextValue = Brand & {
  setImage: (dataUrl: string | null) => void;
  setStyleKeywords: (s: string) => void;
  setPrimaryColor: (s: string) => void;
  clear: () => void;
};

const BrandContext = createContext<BrandContextValue | null>(null);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState<Brand>(EMPTY_BRAND);

  /* Load once after mount so SSR and first client render agree on the empty
     default. localStorage is a client-only API and would throw during SSR. */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        /* Merge with EMPTY_BRAND so an older stored shape (missing newer
           fields like pollinationsToken) doesn't leave them undefined. */
        const parsed = JSON.parse(raw) as Partial<Brand>;
        setBrand({ ...EMPTY_BRAND, ...parsed });
      }
    } catch {
      /* corrupt entry — just fall through to defaults */
    }
  }, []);

  const persist = useCallback((next: Brand) => {
    setBrand(next);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      /* quota exceeded / private browsing — persistence best-effort */
    }
  }, []);

  const setImage = useCallback(
    (dataUrl: string | null) => persist({ ...brand, imageDataUrl: dataUrl }),
    [brand, persist],
  );
  const setStyleKeywords = useCallback(
    (s: string) => persist({ ...brand, styleKeywords: s }),
    [brand, persist],
  );
  const setPrimaryColor = useCallback(
    (s: string) => persist({ ...brand, primaryColor: s }),
    [brand, persist],
  );
  const clear = useCallback(() => persist(EMPTY_BRAND), [persist]);

  const value = useMemo<BrandContextValue>(
    () => ({ ...brand, setImage, setStyleKeywords, setPrimaryColor, clear }),
    [brand, setImage, setStyleKeywords, setPrimaryColor, clear],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
}
