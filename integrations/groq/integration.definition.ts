import { llm } from '@botpress/common'
import { IntegrationDefinition } from '@botpress/sdk'

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
        schema: llm.schemas.GenerateContentInputSchema,
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
