import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
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
        // Railway Backend (Production)
        target: "https://habitloopapp-development.up.railway.app",
        changeOrigin: true,
        secure: true,
        
        // Local Backend (Development) - Uncomment to switch back
        // target: "http://localhost:5000",
        // changeOrigin: true,
        // secure: false,
      },
      "/auth": {
        // Railway Backend (Production)
        target: "https://habitloopapp-development.up.railway.app",
        changeOrigin: true,
        secure: true,
        
        // Local Backend (Development) - Uncomment to switch back
        // target: "http://localhost:5000",
        // changeOrigin: true,
        // secure: false,
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
