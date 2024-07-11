import { llm } from '@botpress/common'
import OpenAI from 'openai'
import { ModelId } from './schemas'
import * as bp from '.botpress'
import { interfaces } from '@botpress/sdk'

const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: bp.secrets.GROQ_API_KEY,
})

const models: Record<ModelId, interfaces.llm.ModelDetails> = {
  // Reference:
  //  https://console.groq.com/docs/models
  //  https://wow.groq.com/
  'llama3-8b-8192': {
    name: 'LLaMA3 8B',
    input: {
      costPer1MTokens: 0.05,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.08,
      maxTokens: 8192,
    },
  },
  'llama3-70b-8192': {
    name: 'LLaMA3 70B',
    input: {
      costPer1MTokens: 0.59,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.79,
      maxTokens: 8192,
    },
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    input: {
      costPer1MTokens: 0.24,
      maxTokens: 32768,
    },
    output: {
      costPer1MTokens: 0.24,
      maxTokens: 32768,
    },
  },
  'gemma-7b-it': {
    name: 'Gemma 7B',
    input: {
      costPer1MTokens: 0.07,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.07,
      maxTokens: 8192,
    },
  },
  'gemma2-9b-it': {
    name: 'Gemma2 9B',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 8192,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent<ModelId>(<llm.GenerateContentInput>input, groqClient, logger, {
        provider: 'groq',
        models,
        defaultModel: 'mixtral-8x7b-32768',
      })
    },
    listModels: async ({}) => {
      return {
        models: Object.entries(models).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
