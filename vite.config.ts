import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/CaludeCodeTest/',
  build: {
    outDir: 'dist',
    target: 'es2020',
    rollupOptions: {
      input: {
        main:        resolve(__dirname, 'index.html'),
        snake:       resolve(__dirname, 'games/snake.html'),
        breakout:    resolve(__dirname, 'games/breakout.html'),
        tetris:      resolve(__dirname, 'games/tetris.html'),
        leaderboard: resolve(__dirname, 'games/leaderboard.html'),
      },
    },
  },
})
