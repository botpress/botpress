import { z } from '@botpress/sdk'

export const modelId = z
  .enum(['llama3.1-8b', 'llama3.1-70b'])
  .describe('Model to use for content generation')
  .placeholder('llama3.1-8b')

export type ModelId = z.infer<typeof modelId>
