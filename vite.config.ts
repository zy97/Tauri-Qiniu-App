import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import WindiCSS from 'vite-plugin-windicss'
import {ViteRsw} from 'vite-plugin-rsw'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),WindiCSS(),ViteRsw()]
})
