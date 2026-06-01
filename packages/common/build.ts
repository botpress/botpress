import esbuild from 'esbuild'
import { dependencies } from './package.json'

const external = Object.keys(dependencies)

const buildCjs = () =>
  esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: 'dist/index.cjs',
    external,
  })

const buildEsm = () =>
  esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/index.mjs',
    external,
  })

const main = async (argv: string[]) => {
  if (argv.includes('--cjs')) {
    return buildCjs()
  }
  if (argv.includes('--esm')) {
    return buildEsm()
  }
  throw new Error('Please specify --cjs or --esm')
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
