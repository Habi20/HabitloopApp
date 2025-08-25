import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      "@": path.resolve(__dirname, "client/src")
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client/dist"),
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor_react';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor_ui';
            }
            if (id.includes('date-fns') || id.includes('lodash') || id.includes('zod')) {
              return 'vendor_utils';
            }
            if (id.includes('@tanstack') || id.includes('zustand')) {
              return 'vendor_state';
            }
            return 'vendor_other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      strict: false,
      allow: [".."],
    },
    hmr: {
      overlay: true,
    },
  }
});