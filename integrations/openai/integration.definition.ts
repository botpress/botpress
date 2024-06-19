import { llm } from '@botpress/common'
import { z, IntegrationDefinition } from '@botpress/sdk'

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
        schema: llm.schemas.GenerateContentInputSchema.extend({
          model: z
            .enum([
              'gpt-4o',
              'gpt-4-turbo',
              'gpt-4-vision-preview',
              'gpt-4-1106-preview',
              'gpt-4-32k',
              'gpt-4',
              'gpt-3.5-turbo-16k',
              'gpt-3.5-turbo',
            ])
            .describe('Model identifier to be used for content generation')
            .default('gpt-4o'),
        }),
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
