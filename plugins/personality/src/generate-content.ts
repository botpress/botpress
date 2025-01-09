import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'
import * as bp from '.botpress'

export type LLMInput = bp.interfaces.llm.actions.generateContent.input.Input
export type LLMOutput = bp.interfaces.llm.actions.generateContent.output.Output

export type LLMMessage = LLMInput['messages'][number]
export type LLMChoice = LLMOutput['choices'][number]

export type GenerateContentProps = {
  client: bp.Client
  input: LLMInput
  integrationName: string
}

export const generateContent = async (props: GenerateContentProps): Promise<LLMOutput> => {
  const { client, input, integrationName } = props
  const response = await client.callAction({
    type: `${integrationName}:generateContent`,
    input,
  })
  return response.output
}

export type PredictResponse = {
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
