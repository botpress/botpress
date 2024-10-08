import { z, IntegrationDefinition } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'anthropic',
  title: 'Anthropic',
  version: '3.3.2',
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
    ANTHROPIC_API_KEY: {
      description: 'Anthropic API key',
    },
  },
}).extend(llm, ({ modelRef }) => ({
  modelRef,
}))
