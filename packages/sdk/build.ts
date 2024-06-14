import esbuild from 'esbuild'

import { dependencies } from './package.json'

const external = Object.keys(dependencies)

void esbuild.build({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  platform: 'node',
  minify: true,
  sourcemap: true,
  outfile: './dist/index.js',
  format: 'cjs',
  external,
})
