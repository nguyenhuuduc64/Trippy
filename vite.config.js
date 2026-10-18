import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Cho phép lắng nghe từ mọi IP trên EC2
    allowedHosts: [
      'openedx.id.vn',
      '.openedx.id.vn', // Cho phép cả các subdomain nếu có
      'localhost',
    ],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173, // Hoặc port bạn đang chạy
    allowedHosts: [
      'openedx.id.vn',
      '.openedx.id.vn',
      'localhost',
    ],
  },
});
