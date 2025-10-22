import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import { jsonrepair } from 'jsonrepair'

export type LLMInput = cognitive.GenerateContentInput

type LLMChoice = cognitive.GenerateContentOutput['choices'][number]

export type PredictResponse<T> = {
  success: boolean
  json: T
}

const parseJson = <T>(expectedSchema: sdk.ZodSchema, str: string): T => {
  const repaired = jsonrepair(str)
  const parsed = JSON.parse(repaired)
  return expectedSchema.parse(parsed)
}

type ParseLLMOutputProps = cognitive.GenerateContentOutput & { schema: sdk.ZodSchema }
export const parseLLMOutput = <T>(props: ParseLLMOutputProps): PredictResponse<T> => {
  const mappedChoices: LLMChoice['content'][] = props.choices.map((choice) => choice.content)
  if (!mappedChoices[0]) throw new sdk.RuntimeError('Could not parse LLM output')
  const firstChoice = mappedChoices[0]
  return {
    success: true,
    json: parseJson<T>(props.schema, firstChoice.toString()),
  }
}
