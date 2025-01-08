import { llm } from '@botpress/common'
import OpenAI from 'openai'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const cerebrasClient = new OpenAI({
  baseURL: 'https://api.cerebras.ai/v1',
  apiKey: bp.secrets.CEREBRAS_API_KEY,
})

const languageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference: https://inference-docs.cerebras.ai/introduction
  'llama3.1-8b': {
    name: 'Llama 3.1 8B',
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    tags: ['low-cost', 'general-purpose'],
    input: {
      costPer1MTokens: 0.1,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.1,
      maxTokens: 8192,
    },
  },
  'llama3.1-70b': {
    name: 'Llama 3.1 70B',
    tags: ['general-purpose'],
    description:
      'Meta developed and released the Meta Llama 3 family of large language models (LLMs), a collection of pretrained and instruction tuned generative text models in 8B and 70B sizes. The Llama 3 instruction tuned models are optimized for dialogue use cases and outperform many of the available open source chat models on common industry benchmarks.',
    input: {
      costPer1MTokens: 0.6,
      maxTokens: 8192,
    },
    output: {
      costPer1MTokens: 0.6,
      maxTokens: 8192,
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
          defaultModel: 'llama3.1-70b',
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
