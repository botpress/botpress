import { llm, speechToText } from '@botpress/common'
import { validateGptOssReasoningEffort } from '@botpress/common/src/llm/openai'
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
  'accounts/fireworks/models/gpt-oss-20b': {
    name: 'GPT-OSS 20B',
    description:
      'gpt-oss-20b is a compact, open-weight language model optimized for low-latency. It shares the same training foundation and capabilities as the GPT-OSS 120B model, with faster responses and lower cost.',
    tags: ['general-purpose', 'reasoning', 'low-cost'],
    input: {
      costPer1MTokens: 0.07,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.3,
      maxTokens: 16_000,
    },
  },
  'accounts/fireworks/models/gpt-oss-120b': {
    name: 'GPT-OSS 120B',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs.',
    tags: ['general-purpose', 'reasoning'],
    input: {
      costPer1MTokens: 0.15,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.6,
      maxTokens: 16_000,
    },
  },
  'accounts/fireworks/models/deepseek-r1-0528': {
    name: 'DeepSeek R1 0528',
    description:
      'The updated DeepSeek R1 0528 model delivers major improvements in reasoning, inference, and accuracy through enhanced post-training optimization and greater computational resources. It now performs at a level approaching top-tier models like OpenAI o3 and Gemini 2.5 Pro, with notable gains in complex tasks such as math and programming. The update also reduces hallucinations, improves function calling, and enhances the coding experience.',
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 160_000,
    },
    output: {
      costPer1MTokens: 8,
      maxTokens: 16_384,
    },
  },
  'accounts/fireworks/models/deepseek-v3-0324': {
    name: 'DeepSeek V3 0324',
    description:
      'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team. It succeeds the DeepSeek V3 model and performs really well on a variety of tasks.',
    tags: ['recommended', 'general-purpose'],
    input: {
      costPer1MTokens: 0.9,
      maxTokens: 160_000,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 16_384,
    },
  },
  'accounts/fireworks/models/llama4-maverick-instruct-basic': {
    name: 'Llama 4 Maverick Instruct (Basic)',
    description:
      'Llama 4 Maverick 17B Instruct (128E) is a high-capacity multimodal language model from Meta, built on a mixture-of-experts (MoE) architecture with 128 experts and 17 billion active parameters per forward pass (400B total). It supports multilingual text and image input, and produces multilingual text and code output across 12 supported languages. Optimized for vision-language tasks, Maverick is instruction-tuned for assistant-like behavior, image reasoning, and general-purpose multimodal interaction, and suited for research and commercial applications requiring advanced multimodal understanding and high model throughput.',
    tags: ['general-purpose', 'vision'],
    input: {
      costPer1MTokens: 0.22,
      maxTokens: 1_000_000,
    },
    output: {
      costPer1MTokens: 0.88,
      maxTokens: 16_384,
    },
  },
  'accounts/fireworks/models/llama4-scout-instruct-basic': {
    name: 'Llama 4 Scout Instruct (Basic)',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, uses 16 experts per forward pass, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, it is instruction-tuned for use in multilingual chat, captioning, and image understanding tasks.',
    tags: ['general-purpose', 'vision'],
    input: {
      costPer1MTokens: 0.15,
      maxTokens: 1_048_576,
    },
    output: {
      costPer1MTokens: 0.6,
      maxTokens: 16_384,
    },
  },
  'accounts/fireworks/models/llama-v3p3-70b-instruct': {
    name: 'Llama 3.3 70B Instruct',
    description:
      'Llama 3.3 70B Instruct is the December update of Llama 3.1 70B. The model improves upon Llama 3.1 70B (released July 2024) with advances in tool calling, multilingual text support, math and coding. The model achieves industry leading results in reasoning, math and instruction following and provides similar performance as 3.1 405B but with significant speed and cost improvements.',
    tags: ['general-purpose'],
    input: {
      costPer1MTokens: 0.9,
      maxTokens: 131_072,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 16_384,
    },
  },
  'accounts/fireworks/models/deepseek-r1': {
    name: 'DeepSeek R1 (Fast)',
    description:
      'This version of the R1 model has a perfect balance between speed and cost-efficiency for real-time interactive experiences, with speeds up to 90 tokens per second.\n\nDeepSeek-R1 is a state-of-the-art large language model optimized with reinforcement learning and cold-start data for exceptional reasoning, math, and code performance. **Note**: This model will always use a temperature of 0.6 as recommended by DeepSeek.',
    tags: ['reasoning', 'general-purpose', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 8,
      maxTokens: 32_768,
    },
  },
  'accounts/fireworks/models/deepseek-r1-basic': {
    name: 'DeepSeek R1 (Basic)',
    description:
      'This version of the R1 model is optimized for throughput and cost-effectiveness and has a lower cost but slightly higher latency than the "Fast" version of the model.\n\nDeepSeek-R1 is a state-of-the-art large language model optimized with reinforcement learning and cold-start data for exceptional reasoning, math, and code performance. **Note**: This model will always use a temperature of 0.6 as recommended by DeepSeek.',
    tags: ['recommended', 'reasoning', 'general-purpose', 'coding'],
    input: {
      costPer1MTokens: 0.55,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 2.19,
      maxTokens: 32_768,
    },
  },
  'accounts/fireworks/models/deepseek-v3': {
    name: 'DeepSeek V3',
    description:
      'A a strong Mixture-of-Experts (MoE) language model with 671B total parameters with 37B activated for each token from Deepseek.',
    tags: ['deprecated', 'general-purpose'],
    input: {
      costPer1MTokens: 0.9,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.9,
      maxTokens: 8_000,
    },
  },
  'accounts/fireworks/models/llama-v3p1-405b-instruct': {
    name: 'Llama 3.1 405B Instruct',
    description:
      'The Meta Llama 3.1 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction tuned generative models in 8B, 70B and 405B sizes. The Llama 3.1 instruction tuned text only models (8B, 70B, 405B) are optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.',
    tags: ['deprecated', 'general-purpose'],
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
    tags: ['deprecated', 'general-purpose'],
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
  'accounts/fireworks/models/gemma2-9b-it': {
    name: 'Gemma 2 9B Instruct',
    description:
      'Redesigned for outsized performance and unmatched efficiency, Gemma 2 optimizes for blazing-fast inference on diverse hardware. Gemma is a family of lightweight, state-of-the-art open models from Google, built from the same research and technology used to create the Gemini models. They are text-to-text, decoder-only large language models, available in English, with open weights, pre-trained variants, and instruction-tuned variants. Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.',
    tags: ['deprecated', 'low-cost', 'general-purpose'],
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
          overrideRequest: (request) => {
            if (input.model?.id === 'accounts/fireworks/models/deepseek-r1') {
              // The DeepSeek R1 model card recommends using a fixed temperature of 0.6 and only using a user prompt rather than a system prompt. See: https://huggingface.co/deepseek-ai/DeepSeek-R1#usage-recommendations
              request.temperature = 0.6
              const systemPrompt = request.messages?.find((message) => message.role === 'system')
              if (systemPrompt) {
                // Remove system prompt from messages
                request.messages = request.messages.filter((x) => x.role !== 'system')

                // Pass system prompt as the first user message instead
                request.messages.unshift({
                  role: 'user',
                  content: systemPrompt.content,
                })
              }
            } else if (
              input.model?.id === 'accounts/fireworks/models/gpt-oss-20b' ||
              input.model?.id === 'accounts/fireworks/models/gpt-oss-120b'
            ) {
              request.reasoning_effort = validateGptOssReasoningEffort(input, logger)

              // Reasoning models don't allow setting temperature
              delete request.temperature
            }

            return request
          },
          overrideResponse: (response) => {
            if (input.model?.id === 'accounts/fireworks/models/deepseek-r1') {
              for (const choice of response.choices) {
                if (choice.message.content) {
                  // DeepSeek R1 returns its CoT in its response between <think> tags so we remove it.
                  choice.message.content = choice.message.content.replace(/<think>.*<\/think>/gis, '')
                }
              }
            }

            return response
          },
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
