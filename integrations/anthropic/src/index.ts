import Anthropic from '@anthropic-ai/sdk'
import { llm } from '@botpress/common'
import { generateContent } from './actions/generate-content'
import { ModelId } from './schemas'
import * as bp from '.botpress'
import { interfaces } from '@botpress/sdk'

const anthropic = new Anthropic({
  apiKey: bp.secrets.ANTHROPIC_API_KEY,
})

const models: Record<ModelId, interfaces.llm.ModelDetails> = {
  // Reference: https://docs.anthropic.com/en/docs/about-claude/models
  'claude-3-5-sonnet-20240620': {
    name: 'Claude 3.5 Sonnet',
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 4096,
    },
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    input: {
      costPer1MTokens: 0.25,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 1.25,
      maxTokens: 4096,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await generateContent<ModelId>(<llm.GenerateContentInput>input, anthropic, logger, {
        models,
        defaultModel: 'claude-3-5-sonnet-20240620',
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
