import { llm } from '@botpress/common'
import { z } from '@botpress/sdk'

export const DEFAULT_MODEL_ID = 'gpt-5-chat'

export const modelId = z
  .enum([
    // xxx: disabled for now, per Seb
    // "most of users that are using Foundry are okay when using model under the 5.0 mark.
    //  Everything above that seems to be causing issues for all my clients"
    //
    // 'gpt-5.1-chat-2025-11-13',
    // 'gpt-5.2-chat-2025-12-11',

    // Starting with gpt-5-chat
    'gpt-5-chat',

    // todo(mendy): get detailed price per token for these
    // 'gpt-5-mini-2025-08-07',
    // 'gpt-4.1-2025-04-14',
    // 'gpt-4.1-mini-2025-04-14',
    // 'gpt-4.1-nano-2025-04-14',
    // 'gpt-4o-2024-11-20',
    // 'gpt-5-nano-2025-08-07',

    // 'o3-mini-2025-01-31',
    // 'o1-pro-2025-03-19',
    // 'DeepSeek-V3.1',
    // 'DeepSeek-R1',
    // 'Llama-3.3-70B-Instruct',
    // 'Llama-4-Scout-17B-16E-Instruct',
    // 'Mistral-Large-3',
    // 'Cohere-command-r-plus',
    // 'qwen-3-32b',
    // 'grok-4-fast-reasoning',
    // 'grok-4-fast-non-reasoning',
    // 'grok-3',
    // 'grok-3-mini',
    // 'claude-sonnet-4-5-20250929',
    // 'claude-opus-4-5-20251101',
    // 'claude-opus-4-1-20250805',
    // 'claude-haiku-4-5-20251001',
  ])
  .describe('Model to use for content generation')
  .placeholder(DEFAULT_MODEL_ID)

export type ModelId = z.infer<typeof modelId>

export const LanguageModels: Record<ModelId, llm.ModelDetails> = {
  'gpt-5-chat': {
    name: 'GPT-5 Chat',
    description:
      'GPT-5 Chat. Advanced, natural, multimodal, and context-aware conversations for enterprise applications.',
    input: {
      // actual cost is 1.25, setting to 0 becuase the customer provides thier own API key
      costPer1MTokens: 0,
      maxTokens: 128_000,
    },
    output: {
      // actual cost is 10, setting to 0 becuase the customer provides thier own API key
      costPer1MTokens: 0,
      maxTokens: 16_384,
    },
    tags: [],
  },
}
