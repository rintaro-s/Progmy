// @ts-check
import { defineConfig } from 'astro/config';

const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')?.[1];
const repoOwner = process.env.GITHUB_REPOSITORY_OWNER;

// https://astro.build/config
export default defineConfig({
  // GitHub Pages (Project Pages) expects your site under /<repo>/
  // Example: https://<owner>.github.io/<repo>/
  site: isGitHubPagesBuild && repoOwner ? `https://${repoOwner}.github.io` : undefined,
  base: isGitHubPagesBuild && repoName ? `/${repoName}` : '/',
  
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
