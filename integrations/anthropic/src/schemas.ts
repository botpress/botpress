import { z } from '@botpress/sdk'

export type ModelId = z.infer<typeof modelId>

export const DefaultModel: ModelId = 'claude-sonnet-4-20250514'

export const modelId = z
  .enum([
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-reasoning-20250514',
    'claude-3-7-sonnet-20250219',
    'claude-3-7-sonnet-reasoning-20250219',
    'claude-3-5-haiku-20241022',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
  ])
  .describe('Model to use for content generation')
  .placeholder(DefaultModel)
