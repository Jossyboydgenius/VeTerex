import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./manifest.json";

export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";

  return {
    plugins: [react(), ...(isExtension ? [crx({ manifest })] : [])],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: isExtension ? "dist-extension" : "dist",
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          ...(isExtension ? { auth: resolve(__dirname, "auth.html") } : {}),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        port: 5173,
      },
    },
  };
});
