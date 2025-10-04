import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "node:path";

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(), // reads the paths we set in tsconfig.app.json
    viteStaticCopy({
      targets: [{ src: "public/manifest.json", dest: "." }],
    }),
  ],
  resolve: {
    // make sure there's only one copy of react/react-dom at runtime
    dedupe: ["react", "react-dom"],
    // helpful with pnpm + workspace symlinks
    preserveSymlinks: true,
  },
  server: {
    // allow importing source outside this package (e.g., ../../packages/ui/src)
    fs: {
      allow: [r("."), r(".."), r("../../packages/ui")],
    },
  },
  optimizeDeps: {
    // don't prebundle your source UI package; let Vite transform it
    exclude: ["@workspace/ui"],
    include: ["react", "react-dom"],
  },
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        main: "./index.html",
        background: "./src/background.ts",
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === "background"
            ? "background.js"
            : "assets/[name]-[hash].js",
      },
    },
    commonjsOptions: { transformMixedEsModules: true },
  },
});
