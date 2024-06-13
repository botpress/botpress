import { GenerateContentInput, openai } from '@botpress/common'
import OpenAI from 'openai'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      const openAIClient = new OpenAI({
        apiKey: bp.secrets.OPENAI_API_KEY,
      })

      return await openai.generateContent(<GenerateContentInput>input, openAIClient, logger, { provider: 'openai' })
    },
  },
  channels: {},
  handler: async () => {},
})
