import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'
import * as bp from '.botpress'

export type LLMInput = bp.interfaces.llm.actions.generateContent.input.Input
export type LLMOutput = bp.interfaces.llm.actions.generateContent.output.Output

type LLMChoice = LLMOutput['choices'][number]
type PredictResponse = {
  success: boolean
  json: object
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
  const firstChoice = mappedChoices[0]!
  return {
    success: true,
    json: tryParseJson(firstChoice as string),
  }
}
