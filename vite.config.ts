import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Identificador único por build. Se inyecta en el bundle (__BUILD_ID__) y se
 * publica en /version.json: si difieren, el front muestra el aviso de
 * "nueva versión" para que el usuario refresque (los celulares de los
 * vendedores cachean el SPA y no ven los fixes).
 */
const buildId = Date.now().toString(36)

const emitVersionJson: Plugin = {
  name: 'emit-version-json',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId }),
    })
  },
}

export default defineConfig({
  plugins: [vue(), emitVersionJson],
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/index.scss" as *;`,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
  },
})
