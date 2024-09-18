import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'cerebras',
  title: 'Cerebras',
  version: '0.1.0',
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
}).extend(interfaces.llm, ({ modelRef }) => ({
  modelRef,
}))
