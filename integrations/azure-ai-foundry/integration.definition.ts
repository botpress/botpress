import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'azure-ai-foundry',
  title: 'Azure AI Foundry',
  description: 'Access a curated list of Azure AI Foundry models to set as your chosen LLM.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      baseUrl: z.string().describe('Base URL for the OpenAI-compatible endpoint').title('Base URL'),
      apiKey: z.string().secret().describe('Azure AI Foundry API key').title('API Key'),
    }),
  },
  entities: {
    modelRef: {
      schema: z.object({
        id: modelId,
      }),
    },
  },
  configurations: {},
  secrets: {},
}).extend(llm, ({ entities: { modelRef } }) => ({
  entities: { modelRef },
}))
