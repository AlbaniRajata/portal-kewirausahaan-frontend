// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//         secure: false
//       },
//       '/uploads': {
//         target: 'http://localhost:3000',
//         changeOrigin: true,
//         secure: false
//       }
//     }
//   },
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes('node_modules')) {
//             if (id.includes('@mui/icons-material')) return 'mui-icons'
//             if (id.includes('@mui/material') || id.includes('@emotion')) return 'mui-core'
//             if (id.includes('recharts')) return 'recharts'
//             if (id.includes('xlsx-js-style') || id.includes('xlsx')) return 'xlsx'
//             // Let Vite handle react-router/react-dom together
//           }
//         }
//       }
//     },
//     chunkSizeWarningLimit: 1000
//   }
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  // Tambahkan blok build di bawah ini untuk menghemat RAM VPS
  build: {
    sourcemap: false,       // Mematikan sourcemap menghemat RAM sangat besar
    minify: 'esbuild',      // Esbuild lebih ringan & cepat dibanding Terser
    reportCompressedSize: false, // Mematikan kalkulasi ukuran file (hemat CPU/RAM)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 2, // Membatasi operasi file paralel agar tidak membebani RAM
    }
  }
})