import { z } from '@botpress/sdk'

export type ModelId = z.infer<typeof modelId>
export const modelId = z
  .enum(['gpt-4o-2024-05-13', 'gpt-4-turbo-2024-04-09', 'gpt-3.5-turbo-0125'])
  .describe('Model to use for content generation')
  .placeholder('gpt-4o-2024-05-13')
