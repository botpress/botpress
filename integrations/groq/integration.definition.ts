import { IntegrationDefinition } from '@botpress/sdk'
import { schemas } from '@botpress/common'

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
        schema: schemas.GenerateContentInputSchema,
      },
      output: {
        schema: schemas.GenerateContentOutputSchema,
      },
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
})
