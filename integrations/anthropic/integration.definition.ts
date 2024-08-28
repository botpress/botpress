import { z, IntegrationDefinition, interfaces } from '@botpress/sdk'
import { modelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'anthropic',
  title: 'Anthropic',
  version: '3.1.1',
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
}).extend(interfaces.llm, ({ modelRef }) => ({
  modelRef,
}))
