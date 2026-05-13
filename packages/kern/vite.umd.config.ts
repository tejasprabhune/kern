import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'kern',
      formats: ['umd'],
      fileName: () => 'kern.min.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2020',
  },
});
