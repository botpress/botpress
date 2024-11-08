import { llm, speechToText } from '@botpress/common'
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
const languageModels: Record<LanguageModelId, llm.ModelDetails> = {
  'accounts/fireworks/models/llama-v3p1-405b-instruct': {
    name: 'Llama 3.1 405B Instruct',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    tags: ['recommended', 'general-purpose'],
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
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    tags: ['general-purpose'],
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
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    tags: ['low-cost', 'general-purpose'],
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
    description:
      'Mistral MoE 8x22B Instruct v0.1 model with Sparse Mixture of Experts. Fine tuned for instruction following.',
    tags: ['general-purpose'],
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
    description:
      'Mistral MoE 8x7B Instruct v0.1 model with Sparse Mixture of Experts. Fine tuned for instruction following',
    tags: ['low-cost', 'general-purpose'],
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
    description:
      "Fireworks' latest and most performant function-calling model. Firefunction-v2 is based on Llama-3 and trained to excel at function-calling as well as chat and instruction-following.",
    tags: ['function-calling'],
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
    description:
      'Vision-language model allowing both image and text as inputs (single image is recommended), trained on OSS model generated training data.',
    tags: ['low-cost', 'vision'],
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
    description:
      'An open-source Mixture-of-Experts (MoE) code language model that achieves performance comparable to GPT4-Turbo in code-specific tasks from Deepseek.',
    tags: ['coding'],
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
    description:
      'DeepSeek-Coder-V2, an open-source Mixture-of-Experts (MoE) code language model that achieves performance comparable to GPT4-Turbo in code-specific tasks.',
    tags: ['low-cost', 'coding'],
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
    description:
      'MythoMax L2 is designed to excel at both roleplaying and storytelling, and is an improved variant of the previous MythoMix model, combining the MythoLogic-L2 and Huginn models.',
    tags: ['roleplay', 'storytelling', 'low-cost'],
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
    description:
      'Qwen 2 is the latest large language model series developed by the Qwen team at Alibaba Cloud. Key features and capabilities of Qwen 2 include multilingual proficiency with a particular strength in Asian languages, and enhanced performance in coding, mathematics, and long context understanding',
    tags: ['general-purpose', 'function-calling'],
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
    generateContent: async ({ input, logger, metadata }) => {
      const output = await llm.openai.generateContent<LanguageModelId>(
        <llm.GenerateContentInput>input,
        fireworksAIClient,
        logger,
        {
          provider,
          models: languageModels,
          defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
        }
      )
      metadata.setCost(output.botpress.cost)
      return output
    },
    transcribeAudio: async ({ input, logger, metadata }) => {
      const output = await speechToText.openai.transcribeAudio(input, fireworksAIClient, logger, {
        provider,
        models: speechToTextModels,
        defaultModel: 'whisper-v3',
      })
      metadata.setCost(output.botpress.cost)
      return output
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
