import { InvalidPayloadError, RuntimeError } from '@botpress/client'
import { llm, speechToText } from '@botpress/common'
import crypto from 'crypto'
import { TextToSpeechPricePer1MCharacters } from 'integration.definition'
import OpenAI, { AzureOpenAI } from 'openai'
import { ImageGenerateParams, Images } from 'openai/resources'
import { SpeechCreateParams } from 'openai/resources/audio/speech'
import { LanguageModelId, ImageModelId } from './schemas'
import * as bp from '.botpress'

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never
type LanguageModel = ArrayElement<Awaited<ReturnType<bp.IntegrationProps['actions']['listLanguageModels']>>['models']>
type ImageModel = ArrayElement<Awaited<ReturnType<bp.IntegrationProps['actions']['listImageModels']>>['models']>
type SttModel = ArrayElement<Awaited<ReturnType<bp.IntegrationProps['actions']['listSpeechToTextModels']>>['models']>

const getOpenAIClient = (ctx: bp.Context): OpenAI =>
  new AzureOpenAI({
    endpoint: ctx.configuration.url,
    apiKey: ctx.configuration.apiKey,
    apiVersion: ctx.configuration.apiVersion,
  })

const getCustomLanguageModels = (ctx: bp.Context) => {
  let models: LanguageModel[] = []
  for (const model of ctx.configuration.customLanguageModels) {
    models.push({
      id: model.key,
      name: model.name,
      description: model.description || '',
      tags: ['general-purpose'],
      input: {
        costPer1MTokens: 0,
        maxTokens: model.maxInputTokens,
      },
      output: {
        costPer1MTokens: 0,
        maxTokens: model.maxOutputTokens,
      },
    })
  }
  return models
}

// TODO: Add custom configs for Image and STT
const getCustomImageModels = (_ctx: bp.Context): ImageModel[] => []
const getCustomSttModels = (_ctx: bp.Context): SttModel[] => []

const converModelsArrayToRecord = <T extends { id: string }>(models: T[]): Record<string, T> => {
  return Object.fromEntries(models.map((model) => [model.id, model]))
}

const SECONDS_IN_A_DAY = 24 * 60 * 60

const provider = 'OpenAI (Azure)'

export default new bp.Integration({
  register: async ({ ctx }) => {
    const { customLanguageModels, defaultLanguageModel } = ctx.configuration
    const customLanguageModelsIds = customLanguageModels.map((model) => model.key)
    if (!customLanguageModelsIds.includes(defaultLanguageModel)) {
      throw new RuntimeError('The default language model must be one of the custom language models')
    }
  },
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata, ctx }) => {
      const openAIClient = getOpenAIClient(ctx)
      const models = converModelsArrayToRecord(getCustomLanguageModels(ctx))
      const output = await llm.openai.generateContent<LanguageModelId>(
        <llm.GenerateContentInput>input,
        openAIClient,
        logger,
        {
          provider,
          models,
          defaultModel: ctx.configuration.defaultLanguageModel,
          overrideRequest: (request) => {
            if (input.model?.id.startsWith('o1-')) {
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
    generateImage: async ({ input, client, ctx, metadata }) => {
      const openAIClient = getOpenAIClient(ctx)

      // TODO: Add default image model to configuration
      const DEFAULT_IMAGE_MODEL_ID = 'dall-e-3-standard-1024'
      const imageModelId = (input.model?.id ?? DEFAULT_IMAGE_MODEL_ID) as ImageModelId
      const imageModels = converModelsArrayToRecord(getCustomImageModels(ctx))
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
    transcribeAudio: async ({ input, logger, metadata, ctx }) => {
      const openAIClient = getOpenAIClient(ctx)
      const models = converModelsArrayToRecord(getCustomSttModels(ctx))
      const output = await speechToText.openai.transcribeAudio(input, openAIClient, logger, {
        provider,
        models,
        defaultModel: 'whisper-1',
      })

      metadata.setCost(output.botpress.cost)
      return output
    },
    generateSpeech: async ({ input, client, metadata, ctx }) => {
      // TODO: Add default TTS model to configuration
      const model = input.model ?? 'tts-1'
      const openAIClient = getOpenAIClient(ctx)
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
    listLanguageModels: async ({ ctx }) => {
      return {
        models: getCustomLanguageModels(ctx),
      }
    },
    listImageModels: async ({ ctx }) => {
      return {
        models: getCustomImageModels(ctx),
      }
    },
    listSpeechToTextModels: async ({ ctx }) => {
      return {
        models: getCustomSttModels(ctx),
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
  // TODO: Return configs of custom image models
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
