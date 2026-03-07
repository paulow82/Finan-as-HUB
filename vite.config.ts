import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Isso garante que os caminhos dos assets sejam relativos, permitindo que o app funcione em qualquer pasta do public_html
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  }
});