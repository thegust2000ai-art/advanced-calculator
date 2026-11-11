import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  server: {
    port: 5174,
    strictPort: false,
  },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // نضمّن كل الأصول (خطوط KaTeX وغيرها) كـ data URIs عشان ملف HTML واحد يعمل بدون أي ملفات جانبية
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
