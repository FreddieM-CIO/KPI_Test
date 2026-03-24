export default {
  cacheDir: '.vite-cache',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['.local-worktrees/**', 'dist/**'],
    pool: 'threads',
  },
}
