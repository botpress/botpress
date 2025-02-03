import { llm } from '@botpress/common'
import * as fslib from 'fs/promises'
import pathlib from 'path'

const GenerateContentInput = llm.schemas.GenerateContentInputBaseSchema.toTypescript()
const GenerateContentOutput = llm.schemas.GenerateContentOutputSchema.toTypescript()
const Model = llm.schemas.ModelSchema.toTypescript()

const types = `
export type GenerateContentInput = ${GenerateContentInput};
export type GenerateContentOutput = ${GenerateContentOutput};
export type Model = ${Model};
`

const main = async (argv: string[]) => {
  const outDir = argv[0]
  if (!outDir) {
    throw new Error('Missing output directory')
  }
  await fslib.mkdir(outDir, { recursive: true })
  await fslib.writeFile(pathlib.join(outDir, 'index.ts'), types)
}

void main(process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
