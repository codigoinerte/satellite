import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // satellite.js dist/index.js re-exports dist/wasm/index.js which uses
      // top-level await, breaking Vite's worker bundler (iife format).
      // This shim re-exports only the pure-JS dist files, fixing the build.
      'satellite.js': fileURLToPath(new URL('./src/lib/satellite-pure.ts', import.meta.url)),
    },
  },
});
