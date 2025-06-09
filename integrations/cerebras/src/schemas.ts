import { z } from '@botpress/sdk'

export const DEFAULT_MODEL_ID = 'llama3.1-8b'

export const modelId = z
  .enum(['llama3.1-8b', 'llama3.3-70b', 'qwen-3-32b'])
  .describe('Model to use for content generation')
  .placeholder(DEFAULT_MODEL_ID)

export type ModelId = z.infer<typeof modelId>
