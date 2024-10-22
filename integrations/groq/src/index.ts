import { llm, speechToText } from '@botpress/common'
import OpenAI from 'openai'
import { ModelId, SpeechToTextModelId } from './schemas'
import * as bp from '.botpress'

const groqClient = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: bp.secrets.GROQ_API_KEY,
})

const languageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference:
  //  https://console.groq.com/docs/models
  //  https://wow.groq.com/
  'llama3-8b-8192': {
    name: 'LLaMA3 8B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8 and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    tags: ['low-cost', 'general-purpose'],
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
    tags: ['general-purpose'],
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8 and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
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
    tags: ['low-cost', 'general-purpose'],
    description:
      'Mistral MoE 8x7B Instruct v0.1 model with Sparse Mixture of Experts. Fine tuned for instruction following',
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
    description:
      'Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    tags: ['deprecated', 'low-cost'],
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
    description:
      'Redesigned for outsized performance and unmatched efficiency, Gemma 2 optimizes for blazing-fast inference on diverse hardware. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    tags: ['low-cost', 'general-purpose'],

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

const speechToTextModels: Record<SpeechToTextModelId, speechToText.SpeechToTextModelDetails> = {
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
    generateContent: async ({ input, logger, metadata }) => {
      const output = await llm.openai.generateContent<ModelId>(<llm.GenerateContentInput>input, groqClient, logger, {
        provider,
        models: languageModels,
        defaultModel: 'mixtral-8x7b-32768',
      })
      metadata.setCost(output.botpress.cost)
      return output
    },
    transcribeAudio: async ({ input, logger, metadata }) => {
      const output = await speechToText.openai.transcribeAudio(input, groqClient, logger, {
        provider,
        models: speechToTextModels,
        defaultModel: 'whisper-large-v3',
      })
      metadata.setCost(output.botpress.cost)
      return output
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
