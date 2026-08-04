import type { Brief } from "@/lib/pack";

/* Shared encoder for the ?brief=... URL parameter.

   The panel opens a new tab with the generated pack; the tab's context reads
   this parameter on mount and boots straight into the generated pack instead
   of the hand-written Offhours example. base64url over a compact JSON blob is
   small enough to sit in a query string, refresh-safe, and survives being
   pasted into a chat — no server, no storage, no window.opener handoff. */

// btoa only handles Latin-1 — the brief may contain £, curly quotes, accents.
// Round-trip through UTF-8 bytes so those survive.
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function briefToParam(brief: Brief): string {
  const json = JSON.stringify(brief);
  return bytesToBase64Url(new TextEncoder().encode(json));
}

export function paramToBrief(param: string): Brief | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(param));
    const parsed = JSON.parse(json);
    // Cheap shape check — a malformed param shouldn't crash the whole page.
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.name === "string" &&
      Array.isArray(parsed.platforms) &&
      parsed.proof
    ) {
      return parsed as Brief;
    }
    return null;
  } catch {
    return null;
  }
}
