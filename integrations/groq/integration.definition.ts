/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { modelId } from 'src/schemas'
import llm from './bp_modules/llm'
import stt from './bp_modules/speech-to-text'

export default new IntegrationDefinition({
  name: 'groq',
  title: 'Groq',
  description: 'Gain access to Groq models for content generation, chat responses, and audio transcription.',
  version: '12.0.1',
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
  .extend(llm, ({ entities: { modelRef } }) => ({ entities: { modelRef } }))
  .extend(stt, ({ entities: { speechToTextModelRef } }) => ({ entities: { speechToTextModelRef } }))
