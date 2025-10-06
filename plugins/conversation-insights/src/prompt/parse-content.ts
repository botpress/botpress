import * as cognitive from '@botpress/cognitive'
import * as sdk from '@botpress/sdk'
import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'

export type LLMInput = cognitive.GenerateContentInput
export type LLMOutput = cognitive.GenerateContentOutput

export type LLMMessage = LLMInput['messages'][number]
export type LLMChoice = LLMOutput['choices'][number]

export type PredictResponse<T> = {
  success: boolean
  json: T
}

const tryParseJson = (str: string) => {
  try {
    return JSON5.parse(jsonrepair(str))
  } catch {
    return str
  }
}

export const parseLLMOutput = <T>(output: LLMOutput): PredictResponse<T> => {
  const mappedChoices: LLMChoice['content'][] = output.choices.map((choice) => choice.content)
  if (!mappedChoices[0]) throw new sdk.RuntimeError('Could not parse LLM output')
  const firstChoice = mappedChoices[0]
  return {
    success: true,
    json: tryParseJson(firstChoice.toString()),
  }
}
