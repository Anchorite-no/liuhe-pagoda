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

export default defineConfig({
  base: './',
  plugins: [woff2Only],
  server: { host: '127.0.0.1' },
  build: { chunkSizeWarningLimit: 2000 },
});
