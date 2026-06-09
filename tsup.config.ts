import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/abi/index.ts",
    "src/generated/index.ts",
    "src/account/index.ts",
    "src/spot/index.ts",
    "src/intent/index.ts",
    "src/events/index.ts",
    "src/errors/index.ts",
    "src/utils/index.ts"
  ],
  clean: true,
  cjsInterop: true,
  dts: true,
  format: ["esm", "cjs"],
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  target: "es2022",
  treeshake: true,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".js" : ".cjs"
    };
  }
});
