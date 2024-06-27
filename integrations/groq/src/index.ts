import { llm } from '@botpress/common'
import OpenAI from 'openai'
import * as bp from '.botpress'

const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: bp.secrets.GROQ_API_KEY,
})

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent(<llm.GenerateContentInput>input, groqClient, logger, {
        provider: 'groq',
        modelCosts: {
          // Source: https://wow.groq.com/
          'llama3-8b-8192': { inputCostPer1MTokens: 0.05, outputCostPer1MTokens: 0.08 },
          'llama3-70b-8192': { inputCostPer1MTokens: 0.59, outputCostPer1MTokens: 0.79 },
          'mixtral-8x7b-32768': { inputCostPer1MTokens: 0.24, outputCostPer1MTokens: 0.24 },
          'gemma-7b-it': { inputCostPer1MTokens: 0.07, outputCostPer1MTokens: 0.07 },
        },
      })
    },
  },
  channels: {},
  handler: async () => {},
})
