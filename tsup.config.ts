import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/todo-index.ts',
    'src/cli.ts',
    'src/create-mcp-config.ts',
    'src/auth-server.ts',
    'src/setup.ts',
    'src/token-manager.ts',
    'src/list-registry.ts'
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
  }
})