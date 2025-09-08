import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Evitar cargar configuración de PostCSS/Tailwind durante pruebas
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      "**/*.disabled.*",
      "**/__tests__/legacy/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
    ],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
