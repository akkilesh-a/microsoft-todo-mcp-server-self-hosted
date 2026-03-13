import { defineConfig } from 'tsup'
import { copyFileSync } from 'fs'

export default defineConfig({
  entry: [
    'src/todo-index.ts',
    'src/cli.ts',
    'src/create-mcp-config.ts',
    'src/auth-server.ts',
    'src/setup.ts',
    'src/token-manager.ts',
    'src/list-registry.ts',
    'src/dashboard.ts'
  ],
  outDir: 'dist',
  format: ['esm'],
  target: 'node16',
  shims: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: true,
  external: ['dotenv'],
  esbuildOptions(options) {
    options.platform = 'node'
  },
  async onSuccess() {
    copyFileSync('src/dashboard.html', 'dist/dashboard.html')
    console.log('Copied dashboard.html to dist/')
  }
})