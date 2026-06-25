import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    types: "src/types.ts",
    logger: "src/logger.ts",
    "ui5-config": "src/ui5-config.ts",
    framework: "src/framework.ts",
    resources: "src/resources.ts",
    themes: "src/themes.ts",
    manifest: "src/manifest.ts"
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "node20",
  external: ["vite", "js-yaml", "@ui5/logger"]
});