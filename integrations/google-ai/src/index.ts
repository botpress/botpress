import { llm } from '@botpress/common'
import { GoogleGenAI } from '@google/genai'
import { generateContent } from './actions/generate-content'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const googleAIClient = new GoogleGenAI({ apiKey: bp.secrets.GOOGLE_AI_API_KEY })

const DEFAULT_LANGUAGE_MODEL_ID: ModelId = 'models/gemini-2.0-flash'

const languageModels: Record<ModelId, llm.ModelDetails> = {
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    description:
      'Gemini 2.5 Flash is Google\'s state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.',
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision'],
    input: {
      // Note: Cost for input audio tokens is significantly higher, but we don't yet support audio content for input.
      costPer1MTokens: 0.3,
      maxTokens: 1_048_576,
    },
    output: {
      costPer1MTokens: 2.5,
      maxTokens: 65_536,
    },
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    description:
      "Gemini 2.5 Pro is Google's state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, reflecting superior human-preference alignment and complex problem-solving abilities.",
    tags: ['recommended', 'reasoning', 'agents', 'general-purpose', 'vision', 'coding'],
    input: {
      // Note: Cost for input audio tokens is significantly higher, but we don't yet support audio content for input.
      costPer1MTokens: 1.25,
      // Note: Gemini 2.5 Pro output token limits are actually much higher than the limit enforced below, but we're limiting it for now as they have a tiered token cost that goes up for prompts longer than a certain amount of tokens, as our model pricing is currently based on a flat price per 1M tokens (no matter the prompt size) which is the standard across all major LLM providers except for Google AI.
      // Reference: https://ai.google.dev/gemini-api/docs/pricing
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 10,
      maxTokens: 65_536,
    },
  },
  'models/gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    description:
      'Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, native tool use, multimodal generation, and a 1M token context window.',
    tags: ['low-cost', 'general-purpose', 'vision'],
    input: {
      // Note: Cost for input audio tokens is significantly higher, but we don't yet support audio content for input.
      costPer1MTokens: 0.1,
      maxTokens: 1_048_576,
    },
    output: {
      costPer1MTokens: 0.4,
      maxTokens: 8192,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await generateContent(<llm.GenerateContentInput>input, googleAIClient, logger, {
        models: languageModels,
        defaultModel: DEFAULT_LANGUAGE_MODEL_ID,
      })
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
