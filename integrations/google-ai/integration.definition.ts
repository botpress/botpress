/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'google-ai',
  title: 'Google AI',
  description: 'Gain access to Gemini models for content generation, chat responses, and advanced language tasks.',
  version: '1.2.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: languageModelId,
      }),
    },
  },
  secrets: {
    GOOGLE_CLOUD_PROJECT_ID: {
      description: 'Google Cloud Project ID',
    },
    VERTEX_AI_SERVICE_ACCOUNT_KEY_JSON: {
      description: 'JSON contents of Vertex AI Service Account Key',
    },
  },
}).extend(llm, ({ modelRef }) => ({ modelRef }))
