import { InvalidPayloadError } from '@botpress/client'
import { llm } from '@botpress/common'
import OpenAI from 'openai'
import { ChatCompletionReasoningEffort } from 'openai/resources'
import { DEFAULT_MODEL_ID, ModelId } from './schemas'
import * as bp from '.botpress'
import { validateGptOssReasoningEffort } from '@botpress/common/src/llm/openai'

const cerebrasClient = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: bp.secrets.CEREBRAS_API_KEY,
})

const languageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference:
  // https://inference-docs.cerebras.ai/models/overview
  // https://www.cerebras.ai/pricing
  'gpt-oss-120b': {
    name: 'GPT-OSS 120B (Preview)',
    description:
      'gpt-oss-120b is a high-performance, open-weight language model designed for production-grade, general-purpose use cases. It excels at complex reasoning and supports configurable reasoning effort, full chain-of-thought transparency for easier debugging and trust, and native agentic capabilities for function calling, tool use, and structured outputs. ',
    tags: ['preview', 'general-purpose', 'reasoning'],
    input: {
      costPer1MTokens: 0.25,
      maxTokens: 131_000,
    },
    output: {
      costPer1MTokens: 0.69,
      maxTokens: 16_000,
    },
  },
  'qwen-3-32b': {
    name: 'Qwen3 32B',
    description:
      'Qwen3-32B is a world-class reasoning model with comparable quality to DeepSeek R1 while outperforming GPT-4.1 and Claude Sonnet 3.7. It excels in code-gen, tool-calling, and advanced reasoning, making it an exceptional model for a wide range of production use cases. NOTE: This model always uses thinking tokens (reasoning) by default, but we have configured it to avoid reasoning (not guaranteed) if the `reasoningEffort` parameter is not set. If the `reasoningEffort` parameter is set, the model will use thinking tokens. The model currently only supports "high" reasoning effort so any other value will be ignored.',
    tags: ['general-purpose', 'reasoning'],
    input: {
      costPer1MTokens: 0.4,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.8,
      maxTokens: 16_000,
    },
  },
  'llama-4-scout-17b-16e-instruct': {
    name: 'Llama 4 Scout 17B',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, uses 16 experts per forward pass, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, it is instruction-tuned for use in multilingual chat, captioning, and image understanding tasks.',
    tags: ['general-purpose'],
    input: {
      costPer1MTokens: 0.65,
      maxTokens: 32_000,
    },
    output: {
      costPer1MTokens: 0.85,
      maxTokens: 16_000,
    },
  },
  'llama3.1-8b': {
    name: 'Llama 3.1 8B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    tags: ['low-cost', 'general-purpose'],
    input: {
      costPer1MTokens: 0.1,
      maxTokens: 32_000,
    },
    output: {
      costPer1MTokens: 0.1,
      maxTokens: 16_000,
    },
  },
  'llama3.3-70b': {
    name: 'Llama 3.3 70B',
    tags: ['general-purpose'],
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      costPer1MTokens: 0.85,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 1.2,
      maxTokens: 16_000,
    },
  },
}

const provider = 'Cerebras'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await llm.openai.generateContent<ModelId>(
        <llm.GenerateContentInput>input,
        cerebrasClient,
        logger,
        {
          provider,
          models: languageModels,
          defaultModel: DEFAULT_MODEL_ID,
          overrideRequest: (request) => {
            if (input.model?.id === 'qwen-3-32b' && input.reasoningEffort === undefined) {
              // As per the Cerebras documentation, the Qwen-3-32B model uses thinking tokens by default but we can suggest it to not do reasoning by appending `/no_think` to the prompt.
              for (const message of request.messages) {
                if (
                  message.role === 'user' &&
                  typeof message.content === 'string' &&
                  !message.content.endsWith('/no_think')
                ) {
                  message.content += ' /no_think'
                  break
                }
              }
            }

            if (input.model?.id === 'gpt-oss-120b') {
              request.reasoning_effort = validateGptOssReasoningEffort(input, logger)

              // Reasoning models don't allow setting temperature
              delete request.temperature
            }

            return request
          },
        }
      )
      metadata.setCost(output.botpress.cost)
      return output
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
