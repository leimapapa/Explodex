import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Explodex/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'jspdf',
        'mgrs',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid'
      ],
    },
  },
  server: {
    host: true,
    port: 3000,
  }
});