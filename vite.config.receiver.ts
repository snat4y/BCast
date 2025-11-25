import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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