import { llm } from '@botpress/common'
import { interfaces } from '@botpress/sdk'
import OpenAI from 'openai'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const openAIClient = new OpenAI({
  apiKey: bp.secrets.OPENAI_API_KEY,
})

// References:
//  https://platform.openai.com/docs/models
//  https://openai.com/api/pricing/
const models: Record<ModelId, interfaces.llm.ModelDetails> = {
  // IMPORTANT: Only full model names should be supported here, as the short model names can be pointed by OpenAI at any time to a newer model with different pricing.
  'gpt-4o-mini-2024-07-18': {
    name: 'GPT 4-o Mini',
    input: {
      costPer1MTokens: 0.15,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.6,
      maxTokens: 4096,
    },
  },
  'gpt-4o-2024-05-13': {
    name: 'GPT 4-o',
    input: {
      costPer1MTokens: 5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 4096,
    },
  },
  'gpt-4-turbo-2024-04-09': {
    name: 'GPT 4 Turbo',
    input: {
      costPer1MTokens: 10,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 30,
      maxTokens: 4096,
    },
  },
  'gpt-3.5-turbo-0125': {
    name: 'GPT 3.5',
    input: {
      costPer1MTokens: 0.5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 1.5,
      maxTokens: 4096,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent<ModelId>(<llm.GenerateContentInput>input, openAIClient, logger, {
        provider: 'openai',
        models,
        defaultModel: 'gpt-4o-mini-2024-07-18',
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
