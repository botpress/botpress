/* bplint-disable */
import { IntegrationDefinition, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'
import llm from './bp_modules/llm'
import stt from './bp_modules/speech-to-text'

export default new IntegrationDefinition({
  name: 'fireworks-ai',
  title: 'Fireworks AI',
  description:
    'Choose from curated Fireworks AI models for content generation, chat completions, and audio transcription.',
  version: '6.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: languageModelId,
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
  },
  secrets: {
    FIREWORKS_AI_API_KEY: {
      description: 'Fireworks AI API key',
    },
  },
})
  .extend(llm, ({ entities: { modelRef } }) => ({ entities: { modelRef } }))
  .extend(stt, ({ entities: { speechToTextModelRef } }) => ({ entities: { speechToTextModelRef } }))
