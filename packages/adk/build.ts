import esbuild from 'esbuild'
import glob from 'glob'

const entryPoints = glob.sync('./src/**/*.ts')
void esbuild.build({
  entryPoints,
  bundle: false,
  platform: 'node',
  format: 'cjs',
  external: [],
  outdir: './dist',
  sourcemap: true,
})
