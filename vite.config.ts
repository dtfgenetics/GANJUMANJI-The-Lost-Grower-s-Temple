import { defineConfig } from 'vite';

export default defineConfig({
  base: '/games/ganjumanji/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022'
  }
});
