import OpenAI from 'openai'
import { GenerateContentInput, openai } from '@botpress/common'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      const groqClient = new OpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: bp.secrets.GROQ_API_KEY,
      })

      return await openai.generateContent(<GenerateContentInput>input, groqClient, logger, { provider: 'groq' })
    },
  },
  channels: {},
  handler: async () => {},
})
