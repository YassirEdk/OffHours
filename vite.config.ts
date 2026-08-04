import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command, mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      // fileURLToPath, not .pathname — on Windows the latter yields
      // "/C:/…/Entreprise%20generate/src", which Node cannot open.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    // Keep a single copy of React/Query in the graph — duplicates break hooks.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  ...(command === "build" && mode === "development"
    ? {
        environments: {
          client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
        },
        esbuild: { keepNames: true },
      }
    : {}),
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    }),
    // Build-only deploy plugin. Change the preset for a different target
    // (e.g. "node-server", "vercel").
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
    viteReact(),
  ],
}));
