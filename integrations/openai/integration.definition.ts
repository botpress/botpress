import { IntegrationDefinition, z } from '@botpress/sdk'
import llm from './bp_modules/llm'
import stt from './bp_modules/speech-to-text'
import tti from './bp_modules/text-to-image'
import { languageModelId } from './src/schemas'

const TextToSpeechModels = ['tts-1', 'tts-1-hd'] as const
type TextToSpeechModel = (typeof TextToSpeechModels)[number]
export const TextToSpeechPricePer1MCharacters: Record<TextToSpeechModel, number> = {
  // Price is in U.S. dollars
  'tts-1': 15,
  'tts-1-hd': 30,
}

export default new IntegrationDefinition({
  name: 'openai',
  title: 'OpenAI',
  description:
    'Gain access to OpenAI models for text generation, speech synthesis, audio transcription, and image generation.',
  version: '18.0.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  entities: {
    modelRef: {
      schema: z.object({
        id: languageModelId,
      }),
    },
    imageModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
    speechToTextModelRef: {
      schema: z.object({
        id: z.string(),
      }),
    },
    imageGenerationParams: {
      schema: z.object({
        style: z
          .enum(['natural', 'vivid'])
          .default('vivid')
          .describe('Image style - Only supported by DALL-E 3 models'),
        user: z.string().optional().describe('User ID to associate with the image, for abuse detection purposes'),
      }),
    },
  },
  secrets: {
    OPENAI_API_KEY: {
      description: 'OpenAI API key',
    },
  },
  actions: {
    generateSpeech: {
      title: 'Generate Speech',
      description: 'Generate Speech',
      billable: true,
      cacheable: true,
      input: {
        schema: z.object({
          model: z.enum(TextToSpeechModels).optional().placeholder('tts-1').describe('The model used').title('Model'),
          input: z.string().describe('The input').title('Input'),
          voice: z
            .enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
            .optional()
            .placeholder('alloy')
            .describe('The voice used')
            .title('Voice'),
          format: z
            .enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'])
            .optional()
            .placeholder('mp3')
            .describe('The format used')
            .title('Format'),
          speed: z.number().min(0.25).max(4).optional().placeholder('1').describe('The speed used').title('Spedd'),
          expiration: z
            .number()
            .int()
            .min(30)
            .max(90)
            .optional()
            .describe(
              'Expiration of the generated audio file in days, after which the file will be automatically deleted to free up storage space in your account. The default is to keep the file indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days.'
            )
            .title('Expiration'),
        }),
      },
      output: {
        schema: z.object({
          audioUrl: z.string().describe('URL to the audio file with the generated speech').title('Audio Url'),
          botpress: z
            .object({
              cost: z.number().describe('Cost of the speech generation, in U.S. dollars').title('Cost'),
            })
            .describe('Cost of the speech generation, in U.S. dollars')
            .title('Botpress'),
        }),
      },
    },
  },
})
  .extend(llm, ({ entities: { modelRef } }) => ({ entities: { modelRef } }))
  .extend(tti, ({ entities: { imageModelRef, imageGenerationParams } }) => ({
    entities: { imageModelRef, imageGenerationParams },
  }))
  .extend(stt, ({ entities: { speechToTextModelRef } }) => ({ entities: { speechToTextModelRef } }))
