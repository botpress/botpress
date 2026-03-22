import { llm } from '@botpress/common'
import OpenAI from 'openai'
import { DEFAULT_MODEL_ID, ModelId } from './schemas'
import * as bp from '.botpress'

const novitaClient = new OpenAI({
  baseURL: 'https://api.novita.ai/openai',
  apiKey: bp.secrets.NOVITA_API_KEY,
})

const languageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference:
  //  https://novita.ai/llm-api
  //  https://novita.ai/pricing
  'moonshotai/kimi-k2.5': {
    name: 'Kimi K2.5',
    description:
      'Kimi K2.5 is a mixture-of-experts model from Moonshot AI with a 262K context window. It supports function calling, structured output, reasoning, and vision (text and image input).',
    tags: ['recommended', 'general-purpose', 'reasoning', 'vision', 'low-cost'],
    input: {
      costPer1MTokens: 0.6,
      maxTokens: 262_144,
    },
    output: {
      costPer1MTokens: 3,
      maxTokens: 262_144,
    },
  },
  'zai-org/glm-5': {
    name: 'GLM-5',
    description:
      'GLM-5 is a mixture-of-experts model from ZhipuAI with a 202K context window. It supports function calling, structured output, and reasoning.',
    tags: ['general-purpose', 'reasoning'],
    input: {
      costPer1MTokens: 1,
      maxTokens: 202_800,
    },
    output: {
      costPer1MTokens: 3.2,
      maxTokens: 131_072,
    },
  },
  'minimax/minimax-m2.5': {
    name: 'MiniMax M2.5',
    description:
      'MiniMax M2.5 is a mixture-of-experts model from MiniMax with a 204K context window. It supports function calling, structured output, and reasoning.',
    tags: ['general-purpose', 'reasoning', 'low-cost'],
    input: {
      costPer1MTokens: 0.3,
      maxTokens: 204_800,
    },
    output: {
      costPer1MTokens: 1.2,
      maxTokens: 131_100,
    },
  },
}

const provider = 'Novita AI'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await llm.openai.generateContent<ModelId>(
        <llm.GenerateContentInput>input,
        novitaClient as any, // TODO: fix mismatch of openai version
        logger,
        {
          provider,
          models: languageModels,
          defaultModel: DEFAULT_MODEL_ID,
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
