import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import { jsonrepair } from 'jsonrepair'

export type LLMInput = cognitive.CognitiveRequest

export type PredictResponse<T> = { success: true; json: T } | { success: false; reason: string }

type ParseLLMOutputProps = Pick<cognitive.CognitiveResponse, 'output'> & { schema: sdk.z.ZodSchema }

/**
 * Parses a model response against the expected schema. An unusable response
 * is reported as an unsuccessful result rather than thrown, so the caller can
 * ask the model again.
 */
export const parseLLMOutput = <T>(props: ParseLLMOutputProps): PredictResponse<T> => {
  if (!props.output) {
    return { success: false, reason: 'the model returned no output' }
  }

  let repairedOutput: unknown

  try {
    repairedOutput = JSON.parse(jsonrepair(props.output))
  } catch (thrown: unknown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown)

    return { success: false, reason: `the model output is not valid JSON: ${message}` }
  }

  const validation = props.schema.safeParse(repairedOutput)

  return validation.success
    ? { success: true, json: validation.data }
    : { success: false, reason: validation.error.message }
}
