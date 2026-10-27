/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@domain': fileURLToPath(new URL('./shared/domain/index.ts', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
  build: { sourcemap: false, chunkSizeWarningLimit: 900 },
});
