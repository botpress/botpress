import { IntegrationDefinition, z } from '@botpress/sdk'
import { ModelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'mistral-ai',
  title: 'Mistral AI',
  description: 'Access a curated list of Mistral AI models to set as your chosen LLM.',
  version: '0.1.1',
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
    MISTRAL_API_KEY: {
      description: 'Mistral AI API key',
    },
  },
  attributes: {
    category: 'AI Models',
  },
}).extend(llm, ({ entities }) => ({
  entities: { modelRef: entities.modelRef },
}))
