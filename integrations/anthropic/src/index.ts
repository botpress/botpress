import Anthropic from '@anthropic-ai/sdk'
import { llm } from '@botpress/common'
import { generateContent } from './actions/generate-content'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const anthropic = new Anthropic({
  apiKey: bp.secrets.ANTHROPIC_API_KEY,
})

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await generateContent<ModelId>(<llm.GenerateContentInput>input, anthropic, logger, {
        models: {
          // Source: https://docs.anthropic.com/en/docs/about-claude/models
          'claude-3-5-sonnet-20240620': {
            inputCostPer1MTokens: 3,
            outputCostPer1MTokens: 15,
            outputTokensLimit: 4096,
          },
          'claude-3-haiku-20240307': {
            inputCostPer1MTokens: 0.25,
            outputCostPer1MTokens: 1.25,
            outputTokensLimit: 4096,
          },
        },
      })
    },
  },
  channels: {},
  handler: async () => {},
})
