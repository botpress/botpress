import { z } from '@botpress/sdk'

export const DEFAULT_MODEL_ID = 'moonshotai/kimi-k2.5'

export const modelId = z
  .enum(['moonshotai/kimi-k2.5', 'zai-org/glm-5', 'minimax/minimax-m2.5'])
  .describe('Model to use for content generation')
  .placeholder(DEFAULT_MODEL_ID)

export type ModelId = z.infer<typeof modelId>
