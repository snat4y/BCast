import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Helper to copy manifest to dist
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    closeBundle: () => {
      fs.copyFileSync('manifest.json', 'dist-extension/manifest.json');
      // Create icons directory if it doesn't exist
      if (!fs.existsSync('dist-extension/icons')) {
        fs.mkdirSync('dist-extension/icons', { recursive: true });
      }
    }
  };
};

export default defineConfig({
  plugins: [react(), copyManifest()],
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'extension/background.ts'),
        content: resolve(__dirname, 'extension/content.ts'),
        cast_bridge: resolve(__dirname, 'extension/cast_bridge.ts'), // Added bridge script
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
});