import { llm } from '@botpress/common'
import { IntegrationDefinition } from '@botpress/sdk'

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
        schema: llm.schemas.GenerateContentInputSchema,
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
