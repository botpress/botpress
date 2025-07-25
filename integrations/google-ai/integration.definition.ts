/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { ModelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'google-ai',
  title: 'Google AI',
  description: 'Gain access to Gemini models for content generation, chat responses, and advanced language tasks.',
  version: '6.0.3',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: ModelId,
      }),
    },
  },
  secrets: {
    GOOGLE_AI_API_KEY: {
      description: 'Google AI API key',
    },
  },
}).extend(llm, ({ entities: { modelRef } }) => ({ entities: { modelRef } }))
