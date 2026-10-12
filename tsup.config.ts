import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node18",
  platform: "node",
  clean: true,
  // Bundle every CLI dependency (several are ESM-only) into a single file.
  noExternal: [/.*/],
});
