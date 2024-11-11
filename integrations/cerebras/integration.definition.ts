/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'cerebras',
  title: 'Cerebras',
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
    CEREBRAS_API_KEY: {
      description: 'Cerebras API key',
    },
  },
}).extend(llm, ({ modelRef }) => ({
  modelRef,
}))
