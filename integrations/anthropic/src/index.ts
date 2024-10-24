import Anthropic from '@anthropic-ai/sdk'
import { llm } from '@botpress/common'
import { generateContent } from './actions/generate-content'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const anthropic = new Anthropic({
  apiKey: bp.secrets.ANTHROPIC_API_KEY,
})

const languageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference: https://docs.anthropic.com/en/docs/about-claude/models
  'claude-3-5-sonnet-20240620': {
    name: 'Claude 3.5 Sonnet',
    description:
      'Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at coding, data science, visual processing, and agentic tasks.',
    tags: ['recommended', 'vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
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
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model for near-instant responsiveness. Quick and accurate targeted performance.",
    tags: ['low-cost', 'general-purpose'],
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
    generateContent: async ({ input, logger, metadata }) => {
      const output = await generateContent<ModelId>(<llm.GenerateContentInput>input, anthropic, logger, {
        models: languageModels,
        defaultModel: 'claude-3-5-sonnet-20240620',
      })
      metadata.setCost(output.botpress.cost)
      return output
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
