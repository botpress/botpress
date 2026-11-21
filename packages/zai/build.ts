import esbuild from 'esbuild'
import glob from 'glob'

const entryPoints = glob.sync('./src/**/*.ts')
void esbuild.build({
  entryPoints,
  platform: 'neutral',
  outdir: './dist',
  // Smaller package without obfuscation: identifiers are kept, so stack traces stay readable
  minifyWhitespace: true,
  minifySyntax: true,
})
