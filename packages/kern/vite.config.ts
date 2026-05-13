import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({ include: ['src'], insertTypesEntry: true }),
  ],
  build: {
    lib: {
      entry: {
        kern: resolve(__dirname, 'src/index.ts'),
        'auto-render': resolve(__dirname, 'src/auto-render.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'cjs') return `${entryName}.cjs`;
        return `${entryName}.js`;
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    minify: 'esbuild',
    target: 'es2020',
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
