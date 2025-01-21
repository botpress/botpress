import esbuild from 'esbuild'
import { devDependencies } from './package.json'

const common: esbuild.BuildOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
}

const external = Object.keys(devDependencies)

const buildCjs = () =>
  esbuild.build({
    ...common,
    platform: 'node',
    minify: false,
    format: 'cjs',
    external,
    outfile: 'dist/index.cjs',
    entryPoints: ['src/index.ts'],
    allowOverwrite: true,
  })

const buildEsm = () =>
  esbuild.build({
    ...common,
    platform: 'browser',
    format: 'esm',
    minify: false,
    external,
    outfile: 'dist/index.mjs',
    entryPoints: ['src/index.ts'],
    allowOverwrite: true,
  })

const main = async (argv: string[]) => {
  if (argv.includes('--neutral')) {
    await buildCjs()
    await buildEsm()
  } else {
    throw new Error('you must specify a build target (--neutral)')
  }
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
