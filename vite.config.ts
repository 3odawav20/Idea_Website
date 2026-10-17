import { defineConfig } from 'vite'
import path from 'path'
import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    figmaAssetResolver(),
    {
      name: 'public-assets-without-private-room-previews',
      apply: 'build',
      closeBundle() {
        const source = path.resolve(__dirname, 'public');
        fs.cpSync(source, path.resolve(__dirname, 'dist'), { recursive: true,
          filter: file => {
            const parts=path.relative(source,file).split(path.sep);
            return !parts.includes('private-previews') && !(parts[0]==='uploads' && parts[1]==='company-products' && parts.length>2 && parts[2]!=='.htaccess');
          },
        });
      },
    },
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: { copyPublicDir: false },
  server: { proxy: {
    '/api': { target: process.env.VITE_PHP_PROXY || 'http://127.0.0.1:5180', changeOrigin: false },
    '/uploads': { target: process.env.VITE_PHP_PROXY || 'http://127.0.0.1:5180', changeOrigin: false },
  } },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
