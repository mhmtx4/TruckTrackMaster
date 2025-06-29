import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'client', // <--- Burası önemli!
  plugins: [react()],
  build: {
    outDir: '../dist', // build çıktısı kök dist'e çıksın
    emptyOutDir: true,
  },
});
