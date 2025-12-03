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
type LanguageDeployment = ArrayElement<bp.Context['configuration']['languagesDeployments']>

const getOpenAIClient = (deployment: LanguageDeployment): OpenAI =>
  new AzureOpenAI({
    endpoint: deployment.url,
    apiKey: deployment.apiKey,
    apiVersion: deployment.apiVersion,
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

const getDeploymentForModel = (ctx: bp.Context, modelId?: LanguageModelId): LanguageDeployment => {
  const deployments = ctx.configuration.languagesDeployments

  if (!deployments || deployments.length === 0) {
    throw new Error('You must configure at least one language deployment in the integration settings')
  }

  if (!modelId) {
    return deployments[0]!
  }

  const deployment = deployments.find((d) => d.name === modelId)
  return deployment ?? deployments[0]!
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
    logger.info('Integration received input', { fullInput: input })
    const modelsArray = getCustomLanguageModels(ctx)
    const models = converModelsArrayToRecord(modelsArray)

    const requestedModelId = input.model?.id as LanguageModelId | undefined
    const deployment = getDeploymentForModel(ctx, requestedModelId)
    const openAIClient = getOpenAIClient(deployment)

    const defaultModel: LanguageModelId =
      requestedModelId ??
      (modelsArray[0]?.id as LanguageModelId) ??
      DEFAULT_LANGUAGE_MODEL_ID

    const modelId: LanguageModelId = requestedModelId ?? defaultModel

    const isGptFive = modelId.startsWith('gpt-5.1')

    // GPT 5.1 path (Responses API)
    if (isGptFive) {
      logger.info('Using GPT 5.1 Responses API path')
      logger.info('Integration received input', { fullInput: input })

      // Extract messages if provided
      let inputContent: any = null

      if (Array.isArray((input as any).messages) && (input as any).messages.length > 0) {
        inputContent = (input as any).messages
      } else {
        // Extract prompt from all known Botpress fields (systemPrompt included)
        const extractedText =
          (input as any).systemPrompt ??
          (input as any).prompt ??
          (input as any).text ??
          (input as any).query ??
          (input as any).userMessage ??
          (typeof (input as any).input === 'string' ? (input as any).input : null)

        if (extractedText) {
          inputContent = [
            {
              role: 'user',
              content: extractedText,
            },
          ]
        }
      }

      // If still nothing, use safe fallback
      if (!inputContent || inputContent.length === 0) {
        const fallbackText = 'Hello'
        logger.warn('GPT 5.1: No valid prompt found, using fallback', { fallbackText })

        inputContent = [
          {
            role: 'user',
            content: fallbackText,
          },
        ]
      }

      const payload: any = {
        model: modelId,
        input: inputContent,
        reasoning: { effort: 'medium' },
      }

      logger.info('Sending payload to Azure Responses API', payload)

      const response = await (openAIClient as any).responses.create(payload)

      logger.info('Raw Azure response', response)

      // Extract assistant text
      let assistantText = ''

      if (Array.isArray(response.output)) {
        const msgBlock = response.output.find((x: any) => x.type === 'message')
        if (msgBlock && Array.isArray(msgBlock.content)) {
          const textChunk = msgBlock.content.find((c: any) => c.text)
          assistantText = textChunk?.text ?? ''
        }
      }

      const cost = response.usage?.total_tokens ?? 0
      metadata.setCost(cost)

      const output: any = {
        id: response.id ?? '',
        model: modelId,
        provider,
        choices: [
          {
            type: 'text',
            role: 'assistant',
            content: assistantText,
            index: 0,
            stopReason: 'stop',
          },
        ],
        usage: {
          inputTokens: response.usage?.input_tokens ?? 0,
          outputTokens: response.usage?.output_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
          inputCost: 0,
          outputCost: 0,
        },
        botpress: {
          cost,
          inputCost: 0,
          outputCost: 0,
        },
        raw: response,
      }

      return output
    }

    // Non GPT 5.1 models: standard Botpress helper
    const output = await llm.openai.generateContent<LanguageModelId>(
      input as llm.GenerateContentInput,
      openAIClient,
      logger,
      {
        provider,
        models,
        defaultModel,
      }
    )

    metadata.setCost(output.botpress.cost)
    return output
  }

,

    // generateImage: async ({ input, client, metadata, ctx }) => {
    //   const openAIClient = getOpenAIClient(ctx)
    //   const models = converModelsArrayToRecord(getCustomLanguageModels(ctx))
    //
    //   const imageModelId = (input.model?.id ?? DEFAULT_IMAGE_MODEL_ID) as ImageModelId
    //   const imageModel = imageModels[imageModelId]
    //   if (!imageModel) {
    //     throw new InvalidPayloadError(
    //       `Model ID "${imageModelId}" is not allowed by this integration, supported model IDs are: ${Object.keys(
    //         imageModels
    //       ).join(', ')}`
    //     )
    //   }
    //
    //   const size = (input.size || imageModel.defaultSize) as NonNullable<ImageGenerateParams['size']>
    //
    //   if (!imageModel.sizes.includes(size)) {
    //     throw new InvalidPayloadError(
    //       `Size "${
    //         input.size
    //       }" is not allowed by the "${imageModelId}" model, supported sizes are: ${imageModel.sizes.join(', ')}`
    //     )
    //   }
    //
    //   const { model, quality } = getOpenAIImageGenerationParams(imageModelId)
    //
    //   const result = await openAIClient.images.generate({
    //     model,
    //     size,
    //     quality,
    //     prompt: input.prompt,
    //     style: input.params?.style,
    //     user: input.params?.user,
    //     response_format: 'url',
    //   })
    //
    //   const temporaryImageUrl = result.data?.[0]?.url
    //   if (!temporaryImageUrl) {
    //     throw new Error('No image was returned by OpenAI')
    //   }
    //
    //   const expiresAt: string | undefined = input.expiration
    //     ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
    //     : undefined
    //
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
    //
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
    //
    //   metadata.setCost(output.botpress.cost)
    //   return output
    // },
    // generateSpeech: async ({ input, client, metadata, ctx }) => {
    //   const openAIClient = getOpenAIClient(ctx)
    //   const model = input.model ?? 'tts-1'
    //
    //   const params: SpeechCreateParams = {
    //     model,
    //     input: input.input,
    //     voice: input.voice ?? 'alloy',
    //     response_format: input.format ?? 'mp3',
    //     speed: input.speed ?? 1,
    //   }
    //
    //   let response: Response
    //
    //   try {
    //     response = await openAIClient.audio.speech.create(params)
    //   } catch (err: any) {
    //     throw llm.createUpstreamProviderFailedError(err)
    //   }
    //
    //   const key = generateFileKey('openai-generateSpeech-', input, `.${params.response_format}`)
    //
    //   const expiresAt = input.expiration
    //     ? new Date(Date.now() + input.expiration * SECONDS_IN_A_DAY * 1000).toISOString()
    //     : undefined
    //
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
    //
    //   const cost = (input.input.length / 1_000_000) * TextToSpeechPricePer1MCharacters[model]
    //   metadata.setCost(cost)
    //   return {
    //     audioUrl: file.url,
    //     botpress: {
    //       cost, // DEPRECATED
    //     },
    //   }
    // },
    //
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
//
//   hash.update(json)
//   const hexHash = hash.digest('hex')
//
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
