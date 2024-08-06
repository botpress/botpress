import { llm, textToSpeech } from '@botpress/common'
import { interfaces } from '@botpress/sdk'
import OpenAI from 'openai'
import { LanguageModelId, ImageModelId, SpeechToTextModelId } from './schemas'
import * as bp from '.botpress'

const fireworksAIClient = new OpenAI({
  baseURL: 'https://api.fireworks.ai/inference/v1',
  apiKey: bp.secrets.FIREWORKS_AI_API_KEY,
})

const DEFAULT_LANGUAGE_MODEL_ID: LanguageModelId = 'accounts/fireworks/models/llama-v3p1-70b-instruct'

// References:
//  https://fireworks.ai/models
//  https://fireworks.ai/pricing
const languageModels: Record<LanguageModelId, interfaces.llm.ModelDetails> = {
  'accounts/fireworks/models/llama-v3p1-405b-instruct': {
    name: 'Llama 3.1 405B Instruct',
    input: {
      costPer1MTokens: 3,
      maxTokens: 131_072,
    },
    output: {
      costPer1MTokens: 3,
      maxTokens: 131_072,
    },
  },
  'accounts/fireworks/models/llama-v3p1-70b-instruct': {
    name: 'Llama 3.1 70B Instruct',
    input: {
      costPer1MTokens: 0.9,
      maxTokens: 131_072,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 131_072,
    },
  },
  'accounts/fireworks/models/llama-v3p1-8b-instruct': {
    name: 'Llama 3.1 8B Instruct',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 131_072,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 131_072,
    },
  },
  'accounts/fireworks/models/mixtral-8x22b-instruct': {
    name: 'Mixtral MoE 8x22B Instruct',
    input: {
      costPer1MTokens: 1.2,
      maxTokens: 65_536,
    },
    output: {
      costPer1MTokens: 1.2,
      maxTokens: 65_536,
    },
  },
  'accounts/fireworks/models/mixtral-8x7b-instruct': {
    name: 'Mixtral MoE 8x7B Instruct',
    input: {
      costPer1MTokens: 0.5,
      maxTokens: 32_768,
    },
    output: {
      costPer1MTokens: 0.5,
      maxTokens: 32_768,
    },
  },
  'accounts/fireworks/models/firefunction-v2': {
    name: 'Firefunction V2',
    input: {
      // Note: pricing page incorrectly shows $0/1M tokens for this model but actual price is mentioned in this blog post: https://fireworks.ai/blog/firefunction-v2-launch-post
      costPer1MTokens: 0.9,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 8192,
    },
  },
  'accounts/fireworks/models/firellava-13b': {
    name: 'FireLLaVA-13B',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 4096,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 4096,
    },
  },
  'accounts/fireworks/models/deepseek-coder-v2-instruct': {
    name: 'DeepSeek Coder V2 Instruct',
    input: {
      costPer1MTokens: 2.7,
      maxTokens: 131_072,
    },
    output: {
      costPer1MTokens: 2.7,
      maxTokens: 131_072,
    },
  },
  'accounts/fireworks/models/deepseek-coder-v2-lite-instruct': {
    name: 'DeepSeek Coder V2 Lite',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 163_840,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 163_840,
    },
  },
  'accounts/fireworks/models/mythomax-l2-13b': {
    name: 'MythoMax L2 13b',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 4096,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 4096,
    },
  },
  'accounts/fireworks/models/qwen2-72b-instruct': {
    name: 'Qwen2 72b Instruct',
    input: {
      costPer1MTokens: 0.9,
      maxTokens: 32_768,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 32_768,
    },
  },
  'accounts/fireworks/models/gemma2-9b-it': {
    name: 'Gemma 2 9B Instruct',
    input: {
      costPer1MTokens: 0.2,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.2,
      maxTokens: 8192,
    },
  },
}

const speechToTextModels: Record<SpeechToTextModelId, interfaces.speechToText.SpeechToTextModelDetails> = {
  'whisper-v3': {
    name: 'Whisper V3',
    costPerMinute: 0.004,
  },
}

const provider = 'Fireworks AI'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent<LanguageModelId>(
        <llm.GenerateContentInput>input,
        fireworksAIClient,
        logger,
        {
          provider,
          models: languageModels,
          defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
        }
      )
    },
    transcribeAudio: async ({ input, logger }) => {
      return await textToSpeech.openai.transcribeAudio(input, fireworksAIClient, logger, {
        provider,
        models: speechToTextModels,
        defaultModel: 'whisper-v3',
      })
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <LanguageModelId>id, ...model })),
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
