import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    // Any request to /api/... is forwarded to our Node.js server.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
