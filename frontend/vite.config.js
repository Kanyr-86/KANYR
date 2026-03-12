import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Bundle analyzer - generates stats.html on build
    // Run 'npm run build' to see the visualization
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ],
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Rollup options for chunking
    rollupOptions: {
      output: {
        // Manual chunks for better caching and lazy loading
        manualChunks: {
          // Vendor chunks - separate from application code
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['vue3-toastify'],
          'vendor-utils': ['axios', 'lodash-es', 'yup'],
          // Bootstrap chunk - only the CSS parts we use
          'bootstrap-styles': ['bootstrap/dist/css/bootstrap-reboot.min.css'],
        },
        // Ensure chunks are properly named for debugging
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/i.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]'
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 500,
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', 'axios', 'lodash-es', 'yup'],
    exclude: ['bootstrap-vue-3'], // Excluded as it's not used
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    },
    port: 5173
  }
})
