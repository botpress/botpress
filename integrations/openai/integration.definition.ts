import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'openai',
  version: '2.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    model: {
      schema: z.object({
        id: modelId,
      }),
    },
  },
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
}).extend(interfaces.llm, ({ model }) => ({
  model,
}))
