import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: true },
  build: {
    target: 'es2022',
    rolldownOptions: { output: { manualChunks: id => id.includes('/node_modules/three/') ? 'three' : undefined } },
    chunkSizeWarningLimit: 900,
  },
});
