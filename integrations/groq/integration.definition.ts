import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'
import stt from './bp_modules/speech-to-text'

export default new IntegrationDefinition({
  name: 'groq',
  title: 'Groq',
  version: '6.3.2',
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
  .extend(llm, ({ modelRef }) => ({
    modelRef,
  }))
  .extend(stt, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
