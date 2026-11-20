import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

// Dev proxy keeps browser + API on the same origin, so the SameSite=Strict
// refresh-token cookie works with no CORS setup. In production nginx does the same job.
export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  server: { port: 3000, proxy: { '/api': 'http://localhost:5000', '/health': 'http://localhost:5000' } },
  build: { chunkSizeWarningLimit: 900 },
});
