import { defineConfig } from 'vite'

export default defineConfig({
  base: '/CaludeCodeTest/',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
})
