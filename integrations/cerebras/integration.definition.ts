import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'cerebras',
  title: 'Cerebras',
  description:
    'Get access to a curated list of Cerebras models for content generation and chat completions within your bot.',
  version: '8.0.2',
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
    CEREBRAS_API_KEY: {
      description: 'Cerebras API key',
    },
  },
  attributes: {
    category: "AI Models"
  }
}).extend(llm, ({ entities: { modelRef } }) => ({
  entities: { modelRef },
}))
