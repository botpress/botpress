import Anthropic from '@anthropic-ai/sdk'
import { llm } from '@botpress/common'
import { GenerateContentInput } from '@botpress/common/src/llm'
import { generateContent } from './actions/generate-content'
import { DefaultModel, ModelId } from './schemas'
import * as bp from '.botpress'

const anthropic = new Anthropic({
  apiKey: bp.secrets.ANTHROPIC_API_KEY,
  timeout: 10 * 60 * 1000, // 10 minute timeout, we set it here to avoid the error thrown by the Anthropic SDK when not using streaming if the request maxTokens parameters is too high (see: https://github.com/anthropics/anthropic-sdk-typescript?tab=readme-ov-file#long-requests)
})

export type ReasoningEffort = NonNullable<GenerateContentInput['reasoningEffort']>

export const ThinkingModeBudgetTokens: Record<ReasoningEffort, number> = {
  none: 0,
  dynamic: 8192, // Note: Anthropic doesn't support dynamic reasoning, so we default this to the same value as "medium"
  low: 2048,
  medium: 8192,
  high: 16_384,
  // Note: we cannot go above 20K tokens for the thinking mode budget as that would require us to use streaming, see:
  // https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#important-considerations-when-using-extended-thinking
}

export const DeprecatedReasoningModelIdReplacements: Record<string, ModelId> = {
  // These "reasoning" model IDs didn't really exist in Anthropic, we used it as a simple way for users to switch between the reasoning mode and the standard mode, but this approach has been deprecated in favor of specifying a reasoning effort in the request to activate reasoning in the model.
  'claude-sonnet-4-reasoning-20250514': 'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-reasoning-20250219': 'claude-3-7-sonnet-20250219',
}

const LanguageModels: Record<ModelId, llm.ModelDetails> = {
  // Reference: https://docs.anthropic.com/en/docs/about-claude/models
  // NOTE: We don't support returning "thinking" blocks from Claude in the integration action output as the concept of "thinking" blocks is a Claude-specific feature that other providers don't have. For now we won't support this as an official feature in the integration so it needs to be taken into account when using reasoning mode and passing a multi-turn conversation history in the generateContent action input.
  // For more information, see: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking#preserving-thinking-blocks
  // NOTE: We intentionally didn't include the Opus model as it's the most expensive model in the market, it's not very popular, and no users have ever requested it so far.
  'claude-sonnet-4-20250514': {
    name: 'Claude Sonnet 4',
    description:
      'Claude Sonnet 4 significantly enhances the capabilities of its predecessor, Sonnet 3.7, excelling in both coding and reasoning tasks with improved precision and controllability. Sonnet 4 balances capability and computational efficiency, making it suitable for a broad range of applications from routine coding tasks to complex software development projects. Key enhancements include improved autonomous codebase navigation, reduced error rates in agent-driven workflows, and increased reliability in following intricate instructions.',
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 64_000,
    },
  },
  'claude-sonnet-4-reasoning-20250514': {
    name: 'Claude Sonnet 4 (Reasoning Mode)',
    description:
      'This model uses the "Extended Thinking" mode and will use a significantly higher amount of output tokens than the Standard Mode, so this model should only be used for tasks that actually require it.\n\nClaude Sonnet 4 significantly enhances the capabilities of its predecessor, Sonnet 3.7, excelling in both coding and reasoning tasks with improved precision and controllability. Sonnet 4 balances capability and computational efficiency, making it suitable for a broad range of applications from routine coding tasks to complex software development projects. Key enhancements include improved autonomous codebase navigation, reduced error rates in agent-driven workflows, and increased reliability in following intricate instructions.',
    tags: ['vision', 'reasoning', 'general-purpose', 'agents', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 64_000,
    },
  },
  'claude-3-7-sonnet-20250219': {
    name: 'Claude 3.7 Sonnet',
    description:
      'Claude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes.',
    tags: ['recommended', 'reasoning', 'agents', 'vision', 'general-purpose', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 64_000,
    },
  },
  'claude-3-7-sonnet-reasoning-20250219': {
    name: 'Claude 3.7 Sonnet (Reasoning Mode)',
    description:
      'This model uses the "Extended Thinking" mode and will use a significantly higher amount of output tokens than the Standard Mode, so this model should only be used for tasks that actually require it.\n\nClaude 3.7 Sonnet is an advanced large language model with improved reasoning, coding, and problem-solving capabilities. The model demonstrates notable improvements in coding, particularly in front-end development and full-stack updates, and excels in agentic workflows, where it can autonomously navigate multi-step processes.',
    tags: ['vision', 'reasoning', 'general-purpose', 'agents', 'coding'],
    input: {
      costPer1MTokens: 3,
      maxTokens: 200_000,
    },
    output: {
      costPer1MTokens: 15,
      maxTokens: 64_000,
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
        defaultModel: DefaultModel,
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
