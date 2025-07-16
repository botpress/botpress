import { llm } from '@botpress/common'
import { z } from '@botpress/sdk'
import esbuild from 'esbuild'
import { writeFileSync } from 'fs'
import { format, resolveConfig } from 'prettier'

import { devDependencies } from './package.json'

const common: esbuild.BuildOptions = {
  bundle: true,
  minify: true,
  sourcemap: true,
}

async function generateTypes() {
  const code =
    `export type GenerateContentInput = ${llm.schemas.GenerateContentInputSchema(z.any()).toTypescriptType()};

export type GenerateContentOutput = ${llm.schemas.GenerateContentOutputSchema.toTypescriptType()};

export type Model = ${llm.schemas.ModelSchema.toTypescriptType()};
`.trim()

  const filePath = './src/schemas.gen.ts'
  const prettierConfig = await resolveConfig(filePath)
  const formattedCode = await format(code, { ...prettierConfig!, filepath: filePath })
  writeFileSync(filePath, formattedCode)
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
  await generateTypes()

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
