import { IntegrationDefinition, z } from '@botpress/sdk'
import { integrationName } from './package.json'
import { GenerateContentInputSchema, GenerateContentOutputSchema } from '../../packages/common/src'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    generateContent: {
      title: 'Generate Content',
      description: 'Generate content using any LLM supported by Groq',
      input: {
        schema: GenerateContentInputSchema,
      },
      output: {
        schema: GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
})
