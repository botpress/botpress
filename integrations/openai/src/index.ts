import { llm } from '@botpress/common'
import OpenAI from 'openai'
import * as bp from '.botpress'

const openAIClient = new OpenAI({
  apiKey: bp.secrets.OPENAI_API_KEY,
})

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent(<llm.GenerateContentInput>input, openAIClient, logger, {
        provider: 'openai',
        modelCosts: {
          // Source: https://openai.com/api/pricing/
          // Only full model names should be supported here, as the short model names can be pointed to a newer model with different pricing by OpenAI at any time.
          'gpt-4o-2024-05-13': { inputCostPer1MTokens: 5, outputCostPer1MTokens: 15 },
          'gpt-3.5-turbo-0125': { inputCostPer1MTokens: 0.5, outputCostPer1MTokens: 1.5 },
          'gpt-4-turbo-2024-04-09': { inputCostPer1MTokens: 10, outputCostPer1MTokens: 30 },
        },
      })
    },
  },
  channels: {},
  handler: async () => {},
})
