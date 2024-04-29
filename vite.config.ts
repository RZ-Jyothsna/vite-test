import { defineConfig } from 'vite'

import svgr from "vite-plugin-svgr";


// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  return {
    plugins: [
      svgr(),
    ],
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "./src/css/lib.scss";`
        }
      }
    },
    build: {
      manifest: true,
      rollupOptions: {
        input: isSsrBuild ? 'src/entry-server.tsx' : 'src/entry-client.tsx',
      },
    }
  }
})