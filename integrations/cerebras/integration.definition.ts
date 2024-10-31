import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'cerebras',
  title: 'Cerebras',
  version: '0.2.2',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.any() as unknown as z.AnyZodObject, // TODO: remove this and bump
  },
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
