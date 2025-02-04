import esbuild from 'esbuild'
import glob from 'glob'

const entryPoints = glob.sync('./src/**/*.ts')
void esbuild.build({
  entryPoints,
  platform: 'neutral',
  outdir: './dist',
})
