import { llm } from '@botpress/common'
import { writeFileSync } from 'node:fs'

const GenerateContentInput = llm.schemas.GenerateContentInputBaseSchema.toTypescript()
const GenerateContentOutput = llm.schemas.GenerateContentOutputSchema.toTypescript()
const Model = llm.schemas.ModelSchema.toTypescript()

const types = `
export type GenerateContentInput = ${GenerateContentInput};
export type GenerateContentOutput = ${GenerateContentOutput};
export type Model = ${Model};
`

writeFileSync('./src/gen.ts', types)
