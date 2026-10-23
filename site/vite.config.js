import { defineConfig } from 'vite';

// Every browser that runs this site supports woff2; drop the larger .woff fallbacks.
const woff2Only = {
  name: 'woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('@fontsource') && id.endsWith('.css')) {
      return code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, '');
    }
  },
};

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [woff2Only],
  // Each dev server runs with its own --mode so parallel servers never share an optimizer cache.
  cacheDir: `node_modules/.vite-${mode}`,
  server: { host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2500,
    rollupOptions: { input: { main: 'index.html' } },
  },
}));
