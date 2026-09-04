import { defineConfig } from 'vite';

export default defineConfig({
  base: '/games/ganjumanji/',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
