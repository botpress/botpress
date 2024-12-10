import esbuild from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { dependencies } from './package.json'

const external = Object.keys(dependencies)
const entryPoint = './src/index.ts'

const buildNode = async () =>
  esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    outfile: './dist/index.cjs',
    sourcemap: true,
  })

const buildBrowser = async () =>
  esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: './dist/index.mjs',
    sourcemap: true,
    plugins: [polyfillNode({ polyfills: { crypto: true } })],
  })

const main = async (argv: string[]) => {
  if (argv.includes('--node')) {
    return buildNode()
  }
  if (argv.includes('--browser')) {
    return buildBrowser()
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
