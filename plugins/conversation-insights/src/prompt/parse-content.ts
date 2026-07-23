import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import { jsonrepair } from 'jsonrepair'

export type LLMInput = cognitive.CognitiveRequest

export type PredictResponse<T> = {
  success: boolean
  json: T
}

const parseJson = <T>(expectedSchema: sdk.z.ZodSchema, str: string): T => {
  const repaired = jsonrepair(str)
  const parsed = JSON.parse(repaired)
  return expectedSchema.parse(parsed)
}

type ParseLLMOutputProps = Pick<cognitive.CognitiveResponse, 'output'> & { schema: sdk.z.ZodSchema }
export const parseLLMOutput = <T>(props: ParseLLMOutputProps): PredictResponse<T> => {
  if (!props.output) throw new sdk.RuntimeError('Could not parse LLM output')
  return {
    success: true,
    json: parseJson<T>(props.schema, props.output),
  }
}
