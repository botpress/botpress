import { llm } from '@botpress/common'
import { z, IntegrationDefinition } from '@botpress/sdk'

const model = z
  .enum(['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307'])
  .describe('Model to use for content generation')
  .default('claude-3-5-sonnet-20240620')

export type Model = z.infer<typeof model>

export default new IntegrationDefinition({
  name: 'anthropic',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    generateContent: {
      title: 'Generate Content',
      description: 'Generate content using any Anthropic model as LLM',
      input: {
        schema: llm.schemas.GenerateContentInputSchema.extend({ model }),
      },
      output: {
        schema: llm.schemas.GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    ANTHROPIC_API_KEY: {
      description: 'Anthropic API key',
    },
  },
})
