import { llm } from '@botpress/common'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateContent } from './actions/generate-content'
import { LanguageModelId } from './schemas'
import * as bp from '.botpress'

const googleAIClient = new GoogleGenerativeAI(bp.secrets.GOOGLE_AI_API_KEY)

const DEFAULT_LANGUAGE_MODEL_ID: LanguageModelId = 'models/gemini-1.5-flash-002'

// NOTE: Gemini output token limits are actually much higher than the limits enforced below, but we're limiting it to 128K for now as they have a tiered token cost that goes up for prompts longer than 128K tokens, as our model pricing is currently based on a flat price per 1M tokens (no matter the prompt size) which is the standard across all major LLM providers except for Google AI.
// Reference: https://ai.google.dev/pricing
const languageModels: Record<LanguageModelId, llm.ModelDetails> = {
  'models/gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description:
      'Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, native tool use, multimodal generation, and a 1M token context window.',
    tags: ['recommended', 'low-cost', 'general-purpose', 'vision'],
    input: {
      // Note: Cost per 1M input audio tokens is significantly higher, but we don't yet support audio content for input.
      costPer1MTokens: 0.1,
      maxTokens: 1_048_576,
    },
    output: {
      costPer1MTokens: 0.4,
      maxTokens: 8192,
    },
  },
  'models/gemini-1.5-flash-8b-001': {
    name: 'Gemini 1.5 Flash-8B',
    description:
      "A small model designed for lower intelligence tasks. Google AI's fastest and most cost-efficient model with great performance for high-frequency tasks.",
    tags: ['low-cost', 'general-purpose', 'vision'],
    input: {
      costPer1MTokens: 0.0375,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.15,
      maxTokens: 128_000,
    },
  },
  'models/gemini-1.5-flash-002': {
    name: 'Gemini 1.5 Flash',
    description:
      "A fast and versatile model for scaling across diverse tasks. Google AI's most balanced multimodal model with great performance for most tasks.",
    tags: ['recommended', 'general-purpose', 'vision'],
    input: {
      costPer1MTokens: 0.075,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 0.3,
      maxTokens: 128_000,
    },
  },
  'models/gemini-1.5-pro-002': {
    name: 'Gemini 1.5 Pro',
    description:
      "A mid-size multimodal model that is optimized for a wide-range of reasoning tasks. Google AI's best-performing model with features for a wide variety of reasoning tasks.",
    tags: ['recommended', 'general-purpose', 'vision'],
    input: {
      costPer1MTokens: 1.25,
      maxTokens: 128_000,
    },
    output: {
      costPer1MTokens: 5,
      maxTokens: 128_000,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await generateContent<LanguageModelId>(<llm.GenerateContentInput>input, googleAIClient, logger, {
        models: languageModels,
        defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
      })
      metadata.setCost(output.botpress.cost)
      return output
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(languageModels).map(([id, model]) => ({ id: <LanguageModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
