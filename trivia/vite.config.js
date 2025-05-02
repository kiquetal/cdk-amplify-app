import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // This alias uses the Vue build that includes the template compiler
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Ensure AWS SDK is properly bundled for browser use
    rollupOptions: {
      output: {
        manualChunks: {
          // Group AWS SDK libraries into a single chunk
          'aws-sdk': [
            '@aws-sdk/client-lambda',
          ]
        }
      }
    }
  },

});
