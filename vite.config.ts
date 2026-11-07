import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the app under /<repo>/ — the workflow passes BASE_PATH (e.g. "/SmartTV").
const base = process.env.BASE_PATH ? `${process.env.BASE_PATH.replace(/\/+$/, '')}/` : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'node', // the render test switches itself to jsdom
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
