import { z, IntegrationDefinition } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'

export default new IntegrationDefinition({
  name: 'anthropic',
  title: 'Anthropic',
  version: '3.3.3',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.any() as unknown as z.AnyZodObject, // TODO: remove this and bump a major
  },
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
