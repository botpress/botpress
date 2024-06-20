import { llm } from '@botpress/common'
import { z, IntegrationDefinition } from '@botpress/sdk'

const model = z
  .enum(['gpt-4o-2024-05-13', 'gpt-4-turbo-2024-04-09', 'gpt-3.5-turbo-0125'])
  .describe('Model to use for content generation')
  .default('gpt-4o-2024-05-13')

export type Model = z.infer<typeof model>

export default new IntegrationDefinition({
  name: 'openai',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    generateContent: {
      title: 'Generate Content',
      description: 'Generate content using any OpenAI model as LLM',
      input: {
        schema: llm.schemas.GenerateContentInputSchema.extend({ model }),
      },
      output: {
        schema: llm.schemas.GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
})
