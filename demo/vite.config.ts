import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prettierMax from 'prettier-max';

export default defineConfig({
  plugins: [react(), prettierMax()],
  server: {
    port: 59517,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: 59517,
  },
});
