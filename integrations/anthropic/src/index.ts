import Anthropic from '@anthropic-ai/sdk'
import { llm } from '@botpress/common'
import { GenerateContentInput } from '@botpress/common/src/llm'
import { generateContent } from './actions/generate-content'
import { ModelId } from './schemas'
import * as bp from '.botpress'

const anthropic = new Anthropic({
  apiKey: bp.secrets.ANTHROPIC_API_KEY,
})

type ReasoningEffort = NonNullable<GenerateContentInput['reasoningEffort']>

export const DefaultReasoningEffort: ReasoningEffort = 'medium'

export const ThinkingModeBudgetTokens: Record<ReasoningEffort, number> = {
  low: 2048,
  medium: 8192,
  high: 16384,
  // Note: we cannot go above 20K tokens for the thinking mode budget as that would require us to use streaming, see:
  // https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#important-considerations-when-using-extended-thinking
}

const LanguageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference: https://docs.anthropic.com/en/docs/about-claude/models
  'claude-3-7-sonnet-20250219': {
    name: 'Claude 3.7 Sonnet (Standard Mode)',
    description:
      'Claude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes.',
    tags: ['recommended', 'vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 8192,
    },
  },
  // NOTE: We don't support returning "thinking" blocks from Claude in the integration action output as the concept of "thinking" blocks is a Claude-specific feature that other providers don't have. For now we won't support this as an official feature in the integration so it needs to be taken into account when using reasoning mode and passing a multi-turn conversation history in the generateContent action input.
  // For more information, see: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#preserving-thinking-blocks
  'claude-3-7-sonnet-reasoning-20250219': {
    name: 'Claude 3.7 Sonnet (Reasoning Mode)',
    description:
      'This model uses the "Extended Thinking" mode of Claude 3.7 Sonnet and will use a significantly higher amount of output tokens than the Standard Mode, so this model should only be used for tasks that actually require it.\n\nClaude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes.',
    tags: ['recommended', 'vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 8192,
    },
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    description:
      'Claude 3.5 Haiku features offers enhanced capabilities in speed, coding accuracy, and tool use. Engineered to excel in real-time applications, it delivers quick response times that are essential for dynamic tasks such as chat interactions and immediate coding suggestions. This makes it highly suitable for environments that demand both speed and precision, such as software development, customer service bots, and data management systems.',
    tags: ['general-purpose'],
    input: {
      costPer1MTokens: 0.8,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 4,
      maxTokens: 8192,
    },
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet (October 2024)',
    description:
      'Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at coding, data science, visual processing, and agentic tasks.',
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 8192,
    },
  },
  'claude-3-5-sonnet-20240620': {
    name: 'Claude 3.5 Sonnet (June 2024)',
    description:
      'Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at coding, data science, visual processing, and agentic tasks.',
    tags: ['vision', 'general-purpose', 'agents', 'coding', 'function-calling', 'storytelling'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 4096,
    },
  },
  'claude-3-haiku-20240307': {
    name: 'Claude 3 Haiku',
    description:
      "Claude 3 Haiku is Anthropic's fastest and most compact model for near-instant responsiveness. Quick and accurate targeted performance.",
    tags: ['low-cost', 'general-purpose'],
    input: {
      costPer1MTokens: 0.25,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 1.25,
      maxTokens: 4096,
    },
  },
}

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    generateContent: async ({ input, logger, metadata }) => {
      const output = await generateContent(<llm.GenerateContentInput>input, anthropic, logger, {
        models: LanguageModels,
        defaultModel: 'claude-3-7-sonnet-20250219',
      })
      metadata.setCost(output.botpress.cost)
      return output
    },
    listLanguageModels: async ({}) => {
      return {
        models: Object.entries(LanguageModels).map(([id, model]) => ({ id: <ModelId>id, ...model })),
      }
    },
  },
  channels: {},
  handler: async () => {},
})
