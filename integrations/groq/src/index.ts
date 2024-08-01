import { llm, textToSpeech } from '@botpress/common'
import { interfaces } from '@botpress/sdk'
import OpenAI from 'openai'
import { ModelId, SpeechToTextModelId } from './schemas'
import * as bp from '.botpress'

const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: bp.secrets.GROQ_API_KEY,
})

const languageModels: Record<ModelId, interfaces.llm.ModelDetails> = {
  // Reference:
  //  https://console.groq.com/docs/models
  //  https://wow.groq.com/
  'llama3-8b-8192': {
    name: 'LLaMA3 8B',
    input: {
      costPer1MTokens: 0.05,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.08,
      maxTokens: 8192,
    },
  },
  'llama3-70b-8192': {
    name: 'LLaMA3 70B',
    input: {
      costPer1MTokens: 0.59,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.79,
      maxTokens: 8192,
    },
  },
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    input: {
      costPer1MTokens: 0.24,
      maxTokens: 32768,
    },
    output: {
      costPer1MTokens: 0.24,
      maxTokens: 32768,
    },
  },
  'gemma-7b-it': {
    name: 'Gemma 7B',
    input: {
      costPer1MTokens: 0.07,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.07,
      maxTokens: 8192,
    },
  },
  'gemma2-9b-it': {
    name: 'Gemma2 9B',
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
  'whisper-large-v3': {
    name: 'Whisper V2',
    costPerMinute: 0.0005,
  },
}

const provider = 'Groq'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger }) => {
      return await llm.openai.generateContent<ModelId>(<llm.GenerateContentInput>input, groqClient, logger, {
        provider,
        models: languageModels,
        defaultModel: 'mixtral-8x7b-32768',
      })
    },
    transcribeAudio: async ({ input, logger }) => {
      return await textToSpeech.openai.transcribeAudio(input, groqClient, logger, {
        provider,
        models: speechToTextModels,
        defaultModel: 'whisper-large-v3',
      })
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
    listSpeechToTextModels: async ({}) => {
      return {
        models: [
          {
            id: 'whisper-1',
            name: 'Whisper V2',
            costPerMinute: 0.006,
          },
        ],
      }
    },
  },
  channels: {},
  handler: async () => {},
})
