import { IntegrationDefinition, interfaces, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'

export default new IntegrationDefinition({
  name: 'groq',
  version: '6.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: modelId,
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
  },
  secrets: {
    GROQ_API_KEY: {
      description: 'Groq API key',
    },
  },
})
  .extend(interfaces.llm, ({ modelRef }) => ({
    modelRef,
  }))
  .extend(interfaces.speechToText, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
