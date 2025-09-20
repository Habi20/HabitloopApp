import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  define: {
    // Enable PWA features
    __PWA_ENABLED__: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": {
        // Local Backend (Development)
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        
        // Railway Backend (Production) - Uncomment to switch to production
        // target: "https://habitloopapp-development.up.railway.app",
        // changeOrigin: true,
        // secure: true,
      },
      "/auth": {
        // Local Backend (Development)
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        
        // Railway Backend (Production) - Uncomment to switch to production
        // target: "https://habitloopapp-development.up.railway.app",
        // changeOrigin: true,
        // secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
