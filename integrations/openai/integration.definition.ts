import { IntegrationDefinition, z } from '@botpress/sdk'
import llm from './bp_modules/llm'
import { languageModelId } from './src/schemas'

const TextToSpeechModels = ['tts-1', 'tts-1-hd'] as const
type TextToSpeechModel = (typeof TextToSpeechModels)[number]
export const TextToSpeechPricePer1MCharacters: Record<TextToSpeechModel, number> = {
  // Price is in U.S. dollars
  'tts-1': 15,
  'tts-1-hd': 30,
}

export default new IntegrationDefinition({
  name: 'azurefoundry',
  title: 'Azure Foundry (OpenAI)',
  description:
    'Gain access to Azure OpenAI models for text generation, speech synthesis, audio transcription, and image generation.',
  version: '1.0.22',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
  schema: z.object({
    languagesDeployments: z
      .array(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          url: z.string().describe('Base URL for the Azure API'),
          apiKey: z.string().describe('Azure API key').secret(),
          apiVersion: z.string().describe('Azure API version'),
          inputMaxTokens: z.number().int().min(1).optional(),
          outputMaxTokens: z.number().int().min(1).optional(),
        })
      )
      .describe('Your models deployments on Azure Foundry (OpenAI Only)'),
    }),
  },
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
  actions: {},
}).extend(llm, ({ entities: { modelRef } }) => ({ entities: { modelRef } }))
// .extend(tti, ({ entities: { imageModelRef, imageGenerationParams } }) => ({
//   entities: { imageModelRef, imageGenerationParams },
// }))
// .extend(stt, ({ entities: { speechToTextModelRef } }) => ({ entities: { speechToTextModelRef } }))
