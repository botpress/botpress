import { llm } from '@botpress/common'
import { IntegrationDefinition, z } from '@botpress/sdk'

const model = z
  .enum(['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'])
  .describe('Model to use for content generation')
  .default('mixtral-8x7b-32768')

export type Model = z.infer<typeof model>

export default new IntegrationDefinition({
  name: 'groq',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    generateContent: {
      title: 'Generate Content',
      description: 'Generate content using any LLM supported by Groq',
      input: {
        schema: llm.schemas.GenerateContentInputSchema.extend({ model }),
      },
      output: {
        schema: llm.schemas.GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
})
