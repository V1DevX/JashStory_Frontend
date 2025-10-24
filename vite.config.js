import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Указываем, что '@' должно разрешаться в корневую папку 'src'
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
