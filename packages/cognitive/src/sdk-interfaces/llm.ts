import z from '@bpinternal/zui'
import type llm from '../../bp_modules/llm'

export type GenerateContentInput = z.TypeOf<typeof llm.definition.actions.generateContent.input.schema>
export type GenerateContentOutput = z.TypeOf<typeof llm.definition.actions.generateContent.output.schema>
export type ListLanguageModelsInput = z.TypeOf<typeof llm.definition.actions.listLanguageModels.input.schema>
export type ListLanguageModelsOutput = z.TypeOf<typeof llm.definition.actions.listLanguageModels.output.schema>
export type Model = ListLanguageModelsOutput['models'][number]
