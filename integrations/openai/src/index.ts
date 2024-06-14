import { schemas, openai } from '@botpress/common'
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
      return await openai.generateContent(<schemas.GenerateContentInput>input, openAIClient, logger, {
        provider: 'openai',
      })
    },
  },
  channels: {},
  handler: async () => {},
})
