// @ts-check
import { defineConfig } from 'astro/config';

const isProduction = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  // For GitHub Pages deployment (only in production)
  site: isProduction ? 'https://your-username.github.io' : undefined,
  base: isProduction ? '/Progrmy' : '/',
  
  // Build output configuration
  build: {
    assets: 'assets'
  },
  
  // Vite configuration for Phaser.js
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            phaser: ['phaser']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['phaser']
    }
  }
});
