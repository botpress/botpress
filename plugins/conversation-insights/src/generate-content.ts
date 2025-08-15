import * as sdk from '@botpress/sdk'
import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'
import { OutputFormat } from './summary-prompt'
import * as bp from '.botpress'

export type LLMInput = bp.interfaces.llm.actions.generateContent.input.Input
export type LLMOutput = bp.interfaces.llm.actions.generateContent.output.Output

export type LLMMessage = LLMInput['messages'][number]
export type LLMChoice = LLMOutput['choices'][number]

type PredictResponse = {
  success: boolean
  json: OutputFormat
}

const tryParseJson = (str: string) => {
  try {
    return JSON5.parse(jsonrepair(str))
  } catch {
    return str
  }
}

export const parseLLMOutput = (output: LLMOutput): PredictResponse => {
  const mappedChoices: LLMChoice['content'][] = output.choices.map((choice) => choice.content)
  if (!mappedChoices[0]) throw new sdk.RuntimeError('Could not parse LLM output')
  const firstChoice = mappedChoices[0]
  return {
    success: true,
    json: tryParseJson(firstChoice.toString()),
  }
}
