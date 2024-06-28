import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'groq',
  version: '0.0.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    model: {
      schema: z.object({ id: modelId }),
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
}).extend(interfaces.llm, ({ model }) => ({ model }))
