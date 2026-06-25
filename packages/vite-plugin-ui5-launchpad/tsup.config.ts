import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    templates: "src/templates.ts",
    apps: "src/apps.ts"
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node20",
  external: ["vite", "@ui5/vite-plugin-ui5"]
});