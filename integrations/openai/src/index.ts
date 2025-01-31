import { InvalidPayloadError } from '@botpress/client'
import { llm, speechToText, textToImage } from '@botpress/common'
import crypto from 'crypto'
import { TextToSpeechPricePer1MCharacters } from 'integration.definition'
import OpenAI from 'openai'
import { ImageGenerateParams, Images } from 'openai/resources'
import { SpeechCreateParams } from 'openai/resources/audio/speech'
import { LanguageModelId, ImageModelId, SpeechToTextModelId } from './schemas'
import * as bp from '.botpress'

const openAIClient = new OpenAI({
  apiKey: bp.secrets.OPENAI_API_KEY,
})

const DEFAULT_LANGUAGE_MODEL_ID: LanguageModelId = 'gpt-4o-mini-2024-07-18'
const DEFAULT_IMAGE_MODEL_ID: ImageModelId = 'dall-e-3-standard-1024'

// References:
//  https://platform.openai.com/docs/models
//  https://openai.com/api/pricing/
const languageModels: Record<LanguageModelId, llm.ModelDetails> = {
  // IMPORTANT: Only full model names should be supported here, as the short model names can be pointed by OpenAI at any time to a newer model with different pricing.
  'o3-mini-2025-01-31': {
    name: 'GPT o3-mini',
    description:
      'o3-mini is our most recent small reasoning model, providing high intelligence at the same cost and latency targets of o1-mini. o3-mini also supports key developer features, like Structured Outputs, function calling, Batch API, and more. Like other models in the o-series, it is designed to excel at science, math, and coding tasks. The knowledge cutoff for o3-mini models is October, 2023.',
    tags: ['reasoning', 'general-purpose'],
    input: {
      costPer1MTokens: 1.1,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 4.4,
      maxTokens: 100_000,
    },
  },
  'o1-2024-12-17': {
    name: 'GPT o1',
    description:
      'The o1 model is designed to solve hard problems across domains. The o1 series of models are trained with reinforcement learning to perform complex reasoning. o1 models think before they answer, producing a long internal chain of thought before responding to the user.',
    tags: ['reasoning', 'vision', 'general-purpose'],
    input: {
      costPer1MTokens: 15,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 60,
      maxTokens: 100_000,
    },
  },
  'o1-mini-2024-09-12': {
    name: 'GPT o1-mini',
    description:
      'The o1-mini model is a fast and affordable reasoning model for specialized tasks. The o1 series of models are trained with reinforcement learning to perform complex reasoning. o1 models think before they answer, producing a long internal chain of thought before responding to the user.',
    tags: ['reasoning', 'vision', 'general-purpose'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 12,
      maxTokens: 65_536,
    },
  },
  'gpt-4o-mini-2024-07-18': {
    name: 'GPT-4o Mini',
    description:
      "GPT-4o mini (“o” for “omni”) is OpenAI's most advanced model in the small models category, and their cheapest model yet. It is multimodal (accepting text or image inputs and outputting text), has higher intelligence than gpt-3.5-turbo but is just as fast. It is meant to be used for smaller tasks, including vision tasks. It's recommended to choose gpt-4o-mini where you would have previously used gpt-3.5-turbo as this model is more capable and cheaper.",
    tags: ['recommended', 'vision', 'low-cost', 'general-purpose', 'function-calling'],
    input: {
      costPer1MTokens: 0.15,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.6,
      maxTokens: 16_384,
    },
  },
  'gpt-4o-2024-11-20': {
    name: 'GPT-4o (November 2024)',
    description:
      "GPT-4o (“o” for “omni”) is OpenAI's most advanced model. It is multimodal (accepting text or image inputs and outputting text), and it has the same high intelligence as GPT-4 Turbo but is cheaper and more efficient.",
    tags: ['recommended', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    input: {
      costPer1MTokens: 2.5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 10,
      maxTokens: 16_384,
    },
  },
  'gpt-4o-2024-08-06': {
    name: 'GPT-4o (August 2024)',
    description:
      "GPT-4o (“o” for “omni”) is OpenAI's most advanced model. It is multimodal (accepting text or image inputs and outputting text), and it has the same high intelligence as GPT-4 Turbo but is cheaper and more efficient.",
    tags: ['recommended', 'vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    input: {
      costPer1MTokens: 2.5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 10,
      maxTokens: 16_384,
    },
  },
  'gpt-4o-2024-05-13': {
    name: 'GPT-4o (May 2024)',
    description:
      "GPT-4o (“o” for “omni”) is OpenAI's most advanced model. It is multimodal (accepting text or image inputs and outputting text), and it has the same high intelligence as GPT-4 Turbo but is cheaper and more efficient.",
    tags: ['vision', 'general-purpose', 'coding', 'agents', 'function-calling'],
    input: {
      costPer1MTokens: 5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 4096,
    },
  },
  'gpt-4-turbo-2024-04-09': {
    name: 'GPT-4 Turbo',
    description:
      'GPT-4 is a large multimodal model (accepting text or image inputs and outputting text) that can solve difficult problems with greater accuracy than any of our previous models, thanks to its broader general knowledge and advanced reasoning capabilities.',
    tags: ['deprecated', 'general-purpose', 'coding', 'agents', 'function-calling'],
    input: {
      costPer1MTokens: 10,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 30,
      maxTokens: 4096,
    },
  },
  'gpt-3.5-turbo-0125': {
    name: 'GPT-3.5 Turbo',
    description:
      'GPT-3.5 Turbo can understand and generate natural language or code and has been optimized for chat but works well for non-chat tasks as well.',
    tags: ['deprecated', 'general-purpose', 'low-cost'],
    input: {
      costPer1MTokens: 0.5,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 1.5,
      maxTokens: 4096,
    },
  },
}

const imageModels: Record<ImageModelId, textToImage.ImageModelDetails> = {
  'dall-e-3-standard-1024': {
    name: 'DALL-E 3 Standard 1024',
    costPerImage: 0.04,
    sizes: ['1024x1024'],
    defaultSize: '1024x1024',
  },
  'dall-e-3-standard-1792': {
    name: 'DALL-E 3 Standard 1792',
    costPerImage: 0.08,
    sizes: ['1024x1792', '1792x1024'],
    defaultSize: '1024x1792',
  },
  'dall-e-3-hd-1024': {
    name: 'DALL-E 3 HD 1024',
    costPerImage: 0.08,
    sizes: ['1024x1024'],
    defaultSize: '1024x1024',
  },
  'dall-e-3-hd-1792': {
    name: 'DALL-E 3 HD 1792',
    costPerImage: 0.12,
    sizes: ['1024x1792', '1792x1024'],
    defaultSize: '1024x1792',
  },
  'dall-e-2-256': {
    name: 'DALL-E 2 256',
    costPerImage: 0.016,
    sizes: ['256x256'],
    defaultSize: '256x256',
  },
  'dall-e-2-512': {
    name: 'DALL-E 2 512',
    costPerImage: 0.018,
    sizes: ['512x512'],
    defaultSize: '512x512',
  },
  'dall-e-2-1024': {
    name: 'DALL-E 2 1024',
    costPerImage: 0.02,
    sizes: ['1024x1024'],
    defaultSize: '1024x1024',
  },
}

const speechToTextModels: Record<SpeechToTextModelId, speechToText.SpeechToTextModelDetails> = {
  'whisper-1': {
    name: 'Whisper V2',
    costPerMinute: 0.006,
  },
}

const SECONDS_IN_A_DAY = 24 * 60 * 60

const provider = 'OpenAI'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await llm.openai.generateContent<LanguageModelId>(
        <llm.GenerateContentInput>input,
        openAIClient,
        logger,
        {
          provider,
          models: languageModels,
          defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
          overrideRequest: (request) => {
            if (input.model?.id.startsWith('o1-') || input.model?.id.startsWith('o3-')) {
              // The o1 models don't allow setting temperature
              delete request.temperature
            }
            return request
          },
        }
      )
      metadata.setCost(output.botpress.cost)
      return output
    },
    generateImage: async ({ input, client, metadata }) => {
      const imageModelId = (input.model?.id ?? DEFAULT_IMAGE_MODEL_ID) as ImageModelId
      const imageModel = imageModels[imageModelId]
      if (!imageModel) {
        throw new InvalidPayloadError(
          `Model ID "${imageModelId}" is not allowed by this integration, supported model IDs are: ${Object.keys(
            imageModels
          ).join(', ')}`
        )
      }

      const size = (input.size || imageModel.defaultSize) as NonNullable<ImageGenerateParams['size']>

      if (!imageModel.sizes.includes(size)) {
        throw new InvalidPayloadError(
          `Size "${
            input.size
          }" is not allowed by the "${imageModelId}" model, supported sizes are: ${imageModel.sizes.join(', ')}`
        )
      }

      const { model, quality } = getOpenAIImageGenerationParams(imageModelId)

      const result = await openAIClient.images.generate({
        model,
        size,
        quality,
        prompt: input.prompt,
        style: input.params?.style,
        user: input.params?.user,
        response_format: 'url',
      })

      const temporaryImageUrl = result.data[0]?.url
      if (!temporaryImageUrl) {
        throw new Error('No image was returned by OpenAI')
      }

      const expiresAt: string | undefined = input.expiration
        ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
        : undefined

      // File storage is billed to the workspace of the bot that called this action.
      const { file } = await client.uploadFile({
        key: generateFileKey('openai-generateImage-', input, '.png'),
        url: temporaryImageUrl,
        contentType: 'image/png',
        accessPolicies: ['public_content'],
        tags: {
          source: 'integration',
          integration: 'openai',
          action: 'generateImage',
        },
        expiresAt,
        publicContentImmediatelyAccessible: true,
      })

      const cost = imageModel.costPerImage
      metadata.setCost(cost)
      return {
        model: imageModelId,
        imageUrl: file.url,
        cost, // DEPRECATED
        botpress: {
          cost, // DEPRECATED
        },
      }
    },
    transcribeAudio: async ({ input, logger, metadata }) => {
      const output = await speechToText.openai.transcribeAudio(input, openAIClient, logger, {
        provider,
        models: speechToTextModels,
        defaultModel: 'whisper-1',
      })

      metadata.setCost(output.botpress.cost)
      return output
    },
    generateSpeech: async ({ input, client, metadata }) => {
      const model = input.model ?? 'tts-1'

      const params: SpeechCreateParams = {
        model,
        input: input.input,
        voice: input.voice ?? 'alloy',
        response_format: input.format ?? 'mp3',
        speed: input.speed ?? 1,
      }

      let response: Response

      try {
        response = await openAIClient.audio.speech.create(params)
      } catch (err: any) {
        throw llm.createUpstreamProviderFailedError(err)
      }

      const key = generateFileKey('openai-generateSpeech-', input, `.${params.response_format}`)

      const expiresAt = input.expiration
        ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
        : undefined

      const { file } = await client.uploadFile({
        key,
        content: await response.arrayBuffer(),
        accessPolicies: ['public_content'],
        publicContentImmediatelyAccessible: true,
        tags: {
          source: 'integration',
          integration: 'openai',
          action: 'generateSpeech',
        },
        expiresAt,
      })

      const cost = (input.input.length / 1_000_000) * TextToSpeechPricePer1MCharacters[model]
      metadata.setCost(cost)
      return {
        audioUrl: file.url,
        botpress: {
          cost, // DEPRECATED
        },
      }
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <LanguageModelId>id, ...model })),
      }
    },
    listImageModels: async ({}) => {
      return {
        models: Object.entries(imageModels).map(([id, model]) => ({ id: <ImageModelId>id, ...model })),
      }
    },
    listSpeechToTextModels: async ({}) => {
      return {
        models: Object.entries(speechToTextModels).map(([id, model]) => ({ id: <ImageModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})

function generateFileKey(prefix: string, input: object, suffix?: string) {
  const json = JSON.stringify(input)
  const hash = crypto.createHash('sha1')

  hash.update(json)
  const hexHash = hash.digest('hex')

  return prefix + Date.now() + '_' + hexHash + suffix
}

function getOpenAIImageGenerationParams(modelId: ImageModelId): {
  model: Images.ImageGenerateParams['model']
  quality?: Images.ImageGenerateParams['quality']
} {
  switch (modelId) {
    case 'dall-e-3-standard-1024':
      return { model: 'dall-e-3', quality: 'standard' }
    case 'dall-e-3-standard-1792':
      return { model: 'dall-e-3', quality: 'standard' }
    case 'dall-e-3-hd-1024':
      return { model: 'dall-e-3', quality: 'hd' }
    case 'dall-e-3-hd-1792':
      return { model: 'dall-e-3', quality: 'hd' }
    case 'dall-e-2-256':
      return { model: 'dall-e-2' }
    case 'dall-e-2-512':
      return { model: 'dall-e-2' }
    case 'dall-e-2-1024':
      return { model: 'dall-e-2' }
    default:
      throw new Error(`Invalid model ID: ${modelId}`)
  }
}
