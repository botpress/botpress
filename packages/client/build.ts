import esbuild from 'esbuild'

const common: esbuild.BuildOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
}

const buildNode = () =>
  esbuild.build({
    ...common,
    platform: 'node',
    format: 'cjs',
    external: ['axios', 'browser-or-node'],
    outfile: 'dist/index.cjs',
    entryPoints: ['src/index.ts'],
  })

const buildBrowser = () =>
  esbuild.build({
    ...common,
    platform: 'browser',
    format: 'esm',
    external: ['crypto', 'axios', 'browser-or-node'],
    outfile: 'dist/index.mjs',
    entryPoints: ['src/index.ts'],
  })

const buildBundle = () =>
  esbuild.build({
    ...common,
    platform: 'node',
    outfile: 'dist/bundle.cjs',
    entryPoints: ['src/index.ts'],
  })

const main = async (argv: string[]) => {
  if (argv.includes('--node')) {
    return buildNode()
  }
  if (argv.includes('--browser')) {
    return buildBrowser()
  }
  if (argv.includes('--bundle')) {
    return buildBundle()
  }
  throw new Error('Please specify --node, --browser, or --bundle')
}

void main(process.argv.slice(2))
  .then(() => {
    console.info('Done')
    process.exit(0)
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
