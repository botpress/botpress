import { InvalidPayloadError } from '@botpress/client'
import { llm, speechToText, textToImage } from '@botpress/common'
import { validateOpenAIReasoningEffort } from '@botpress/common/src/llm/openai'
import crypto from 'crypto'
import { TextToSpeechPricePer1MCharacters } from 'integration.definition'
import OpenAI, { AzureOpenAI } from 'openai'
import { ImageGenerateParams, Images } from 'openai/resources'
import { SpeechCreateParams } from 'openai/resources/audio/speech'
import { ChatCompletionReasoningEffort } from 'openai/resources/chat/completions'
import { LanguageModelId, ImageModelId, SpeechToTextModelId } from './schemas'
import * as bp from '.botpress'

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never
type LanguageModel = ArrayElement<Awaited<ReturnType<bp.IntegrationProps['actions']['listLanguageModels']>>['models']>

const getOpenAIClient = (ctx: bp.Context): OpenAI =>
  new AzureOpenAI({
    endpoint: ctx.configuration.url,
    apiKey: ctx.configuration.apiKey,
    apiVersion: ctx.configuration.apiVersion,
  })

const getCustomLanguageModels = (ctx: bp.Context) => {
  const models: LanguageModel[] = []
  for (const model of ctx.configuration.languagesDeployments) {
    models.push({
      id: model.name,
      name: model.name,
      description: model.description || '',
      tags: ['general-purpose'],
      input: {
        costPer1MTokens: 0,
        maxTokens: model.inputMaxTokens || 100000,
      },
      output: {
        costPer1MTokens: 0,
        maxTokens: model.outputMaxTokens || 100000,
      },
    })
  }
  return models
}

const converModelsArrayToRecord = <T extends { id: string }>(models: T[]): Record<string, T> => {
  return Object.fromEntries(models.map((model) => [model.id, model]))
}

const DEFAULT_LANGUAGE_MODEL_ID: LanguageModelId = 'gpt-4o-mini-2024-07-18'
const DEFAULT_IMAGE_MODEL_ID: ImageModelId = 'dall-e-3-standard-1024'

const speechToTextModels: Record<SpeechToTextModelId, speechToText.SpeechToTextModelDetails> = {
  'whisper-1': {
    name: 'Whisper V2',
    costPerMinute: 0.006,
  },
}

const SECONDS_IN_A_DAY = 24 * 60 * 60

const provider = 'OpenAI'

// oxlint-disable-next-line no-unused-vars
const SupportedReasoningEfforts = ['minimal', 'low', 'medium', 'high'] as ChatCompletionReasoningEffort[]

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    listLanguageModels: async ({ ctx }) => {
      return {
        models: getCustomLanguageModels(ctx),
      }
    },
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
          defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
          overrideRequest: (request) => {
            const isReasoningModel =
              input.model?.id.startsWith('gpt-5-') ||
              input.model?.id.startsWith('gpt-5.1-') ||
              input.model?.id.startsWith('o1-') ||
              input.model?.id.startsWith('o3-') ||
              input.model?.id.startsWith('o4-')

            if (isReasoningModel) {
              if (input.reasoningEffort) {
                request.reasoning_effort = validateOpenAIReasoningEffort(input, logger)
              } else {
                if (input.model?.id.startsWith('gpt-5.1-')) {
                  // GPT-5.1 is a hybrid reasoning model that supports optional reasoning, so if no reasoning effort is specified we assume the user doesn't want the model to do reasoning (to reduce cost/latency).
                  request.reasoning_effort = 'none'
                } else if (input.model?.id.startsWith('gpt-5-')) {
                  // GPT-5 is a hybrid model but it doesn't support optional reasoning, so if reasoning effort isn't specified we assume the user wants to use the least amount of reasoning possible (to reduce cost/latency).
                  request.reasoning_effort = 'minimal'
                }
                // For other reasoning models we leave the reasoning effort undefined so it uses the default effort specified by the provider.
              }

              // Reasoning models don't support stop sequences
              delete request.stop

              if (request.reasoning_effort !== 'none') {
                // Temperature is not supported when using reasoning
                delete request.temperature
              }
            }
            return request
          },
        }
      )
      metadata.setCost(output.botpress.cost)
      return output
    },
    // generateImage: async ({ input, client, metadata, ctx }) => {
    //   const openAIClient = getOpenAIClient(ctx)
    //   const models = converModelsArrayToRecord(getCustomLanguageModels(ctx))

    //   const imageModelId = (input.model?.id ?? DEFAULT_IMAGE_MODEL_ID) as ImageModelId
    //   const imageModel = imageModels[imageModelId]
    //   if (!imageModel) {
    //     throw new InvalidPayloadError(
    //       `Model ID "${imageModelId}" is not allowed by this integration, supported model IDs are: ${Object.keys(
    //         imageModels
    //       ).join(', ')}`
    //     )
    //   }

    //   const size = (input.size || imageModel.defaultSize) as NonNullable<ImageGenerateParams['size']>

    //   if (!imageModel.sizes.includes(size)) {
    //     throw new InvalidPayloadError(
    //       `Size "${
    //         input.size
    //       }" is not allowed by the "${imageModelId}" model, supported sizes are: ${imageModel.sizes.join(', ')}`
    //     )
    //   }

    //   const { model, quality } = getOpenAIImageGenerationParams(imageModelId)

    //   const result = await openAIClient.images.generate({
    //     model,
    //     size,
    //     quality,
    //     prompt: input.prompt,
    //     style: input.params?.style,
    //     user: input.params?.user,
    //     response_format: 'url',
    //   })

    //   const temporaryImageUrl = result.data?.[0]?.url
    //   if (!temporaryImageUrl) {
    //     throw new Error('No image was returned by OpenAI')
    //   }

    //   const expiresAt: string | undefined = input.expiration
    //     ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
    //     : undefined

    //   // File storage is billed to the workspace of the bot that called this action.
    //   const { file } = await client.uploadFile({
    //     key: generateFileKey('openai-generateImage-', input, '.png'),
    //     url: temporaryImageUrl,
    //     contentType: 'image/png',
    //     accessPolicies: ['public_content'],
    //     tags: {
    //       source: 'integration',
    //       integration: 'openai',
    //       action: 'generateImage',
    //     },
    //     expiresAt,
    //     publicContentImmediatelyAccessible: true,
    //   })

    //   const cost = imageModel.costPerImage
    //   metadata.setCost(cost)
    //   return {
    //     model: imageModelId,
    //     imageUrl: file.url,
    //     cost, // DEPRECATED
    //     botpress: {
    //       cost, // DEPRECATED
    //     },
    //   }
    // },
    // transcribeAudio: async ({ input, logger, metadata, ctx }) => {
    //   const openAIClient = getOpenAIClient(ctx)
    //   const output = await speechToText.openai.transcribeAudio(input, openAIClient, logger, {
    //     provider,
    //     models: speechToTextModels,
    //     defaultModel: 'whisper-1',
    //   })

    //   metadata.setCost(output.botpress.cost)
    //   return output
    // },
    // generateSpeech: async ({ input, client, metadata, ctx }) => {
    //   const openAIClient = getOpenAIClient(ctx)
    //   const model = input.model ?? 'tts-1'

    //   const params: SpeechCreateParams = {
    //     model,
    //     input: input.input,
    //     voice: input.voice ?? 'alloy',
    //     response_format: input.format ?? 'mp3',
    //     speed: input.speed ?? 1,
    //   }

    //   let response: Response

    //   try {
    //     response = await openAIClient.audio.speech.create(params)
    //   } catch (err: any) {
    //     throw llm.createUpstreamProviderFailedError(err)
    //   }

    //   const key = generateFileKey('openai-generateSpeech-', input, `.${params.response_format}`)

    //   const expiresAt = input.expiration
    //     ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
    //     : undefined

    //   const { file } = await client.uploadFile({
    //     key,
    //     content: await response.arrayBuffer(),
    //     accessPolicies: ['public_content'],
    //     publicContentImmediatelyAccessible: true,
    //     tags: {
    //       source: 'integration',
    //       integration: 'openai',
    //       action: 'generateSpeech',
    //     },
    //     expiresAt,
    //   })

    //   const cost = (input.input.length / 1_000_000) * TextToSpeechPricePer1MCharacters[model]
    //   metadata.setCost(cost)
    //   return {
    //     audioUrl: file.url,
    //     botpress: {
    //       cost, // DEPRECATED
    //     },
    //   }
    // },

    // listImageModels: async ({}) => {
    //   return {
    //     models: [],
    //   }
    // },
    // listSpeechToTextModels: async ({}) => {
    //   return {
    //     models: [],
    //   }
    // },
  },
  channels: {},
  handler: async () => {},
})

// function generateFileKey(prefix: string, input: object, suffix?: string) {
//   const json = JSON.stringify(input)
//   const hash = crypto.createHash('sha1')

//   hash.update(json)
//   const hexHash = hash.digest('hex')

//   return prefix + Date.now() + '_' + hexHash + suffix
// }

// function getOpenAIImageGenerationParams(modelId: ImageModelId): {
//   model: Images.ImageGenerateParams['model']
//   quality?: Images.ImageGenerateParams['quality']
// } {
//   switch (modelId) {
//     case 'dall-e-3-standard-1024':
//       return { model: 'dall-e-3', quality: 'standard' }
//     case 'dall-e-3-standard-1792':
//       return { model: 'dall-e-3', quality: 'standard' }
//     case 'dall-e-3-hd-1024':
//       return { model: 'dall-e-3', quality: 'hd' }
//     case 'dall-e-3-hd-1792':
//       return { model: 'dall-e-3', quality: 'hd' }
//     case 'dall-e-2-256':
//       return { model: 'dall-e-2' }
//     case 'dall-e-2-512':
//       return { model: 'dall-e-2' }
//     case 'dall-e-2-1024':
//       return { model: 'dall-e-2' }
//     default:
//       throw new Error(`Invalid model ID: ${modelId}`)
//   }
// }
