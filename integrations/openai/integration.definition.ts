import { schemas } from '@botpress/common'
import { IntegrationDefinition } from '@botpress/sdk'

export default new IntegrationDefinition({
  name: 'groq',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  actions: {
    generateContent: {
      title: 'Generate Content',
      description: 'Generate content using any OpenAI model as LLM',
      input: {
        schema: schemas.GenerateContentInputSchema,
      },
      output: {
        schema: schemas.GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
})
