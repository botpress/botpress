import { defineConfig } from '@botpress/adk'
import { z } from '@botpress/sdk'

export default defineConfig({
  name: 'agentic',
  description: 'my agentic bot',
  instruction: 'You are a sales agent. Try to sell me something',
  inactivityTimeout: 30,
  nodeRepetitionLimit: 3,
  config: z.object({
    name: z.string(),
  }),
  sandbox: {
    enableBotpressClient: true,
  },
  llm: {
    defaultModelFast: '',
    defaultModelBest: '',
    fallbackModel: '',
    llmzModel: '',
  },
  variables: {
    test: z.object({}),
  },
})
