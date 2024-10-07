import { IntegrationDefinition, InterfacePackage, interfaces, z } from '@botpress/sdk'
import { languageModelId } from 'src/schemas'

const llmPkg = {
  type: 'interface',
  definition: interfaces.llm,
} satisfies InterfacePackage

const sttPkg = {
  type: 'interface',
  definition: interfaces.speechToText,
} satisfies InterfacePackage

const ttiPkg = {
  type: 'interface',
  definition: interfaces.textToImage,
} satisfies InterfacePackage

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
  version: '6.6.1',
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
      billable: true,
      cacheable: true,
      input: {
        schema: z.object({
          model: z.enum(TextToSpeechModels).optional().placeholder('tts-1'),
          input: z.string(),
          voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().placeholder('alloy'),
          format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).optional().placeholder('mp3'),
          speed: z.number().min(0.25).max(4).optional().placeholder('1'),
          expiration: z
            .number()
            .int()
            .min(30)
            .max(90)
            .optional()
            .describe(
              'Expiration of the generated audio file in days, after which the file will be automatically deleted to free up storage space in your account. The default is to keep the file indefinitely (no expiration). The minimum is 30 days and the maximum is 90 days.'
            ),
        }),
      },
      output: {
        schema: z.object({
          audioUrl: z.string().describe('URL to the audio file with the generated speech'),
          botpress: z.object({
            cost: z.number().describe('Cost of the speech generation, in U.S. dollars'),
          }),
        }),
      },
    },
  },
})
  .extend(llmPkg, ({ modelRef }) => ({ modelRef }))
  .extend(ttiPkg, ({ imageModelRef, imageGenerationParams }) => ({
    imageModelRef,
    imageGenerationParams,
  }))
  .extend(sttPkg, ({ speechToTextModelRef }) => ({ speechToTextModelRef }))
