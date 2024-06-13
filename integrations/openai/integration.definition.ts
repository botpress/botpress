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
      description: 'Generate content using any OpenAI model as LLM',
      input: {
        schema: GenerateContentInputSchema,
      },
      output: {
        schema: GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
})
