import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for static hosting flexibility
  build: {
    outDir: 'dist-receiver',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'receiver.html'),
      }
    }
  }
});