import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'novita-ai',
  title: 'Novita AI',
  description:
    'Get access to a curated list of Novita AI models for content generation and chat completions within your bot.',
  version: '1.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: modelId,
      }),
    },
  },
  secrets: {
    NOVITA_API_KEY: {
      description: 'Novita AI API key',
    },
  },
  attributes: {
    category: 'AI Models',
  },
}).extend(llm, ({ entities: { modelRef } }) => ({
  entities: { modelRef },
}))
