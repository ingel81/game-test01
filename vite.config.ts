import { defineConfig } from 'vite';

/**
 * Vereinfachte Konfiguration für Vite
 */
export default defineConfig({
  base: './',
  server: {
    port: 3000,
    open: true
  },
  // Assets werden standardmäßig aus dem public-Verzeichnis geladen
  // und sind dann unter / verfügbar
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser']
        }
      }
    }
  },
  resolve: {
    extensions: ['.ts', '.js', '.mjs']
  },
  optimizeDeps: {
    include: ['phaser']
  }
}); 