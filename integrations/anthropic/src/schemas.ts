import { z } from '@botpress/sdk'

export type ModelId = z.infer<typeof ModelId>

export const DefaultModel: ModelId = 'claude-sonnet-4-5-20250929'

export const ModelId = z
  .enum([
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5-20251001',
    'claude-haiku-4-5-reasoning-20251001',
    'claude-sonnet-4-5-20250929',
    'claude-sonnet-4-5-reasoning-20250929',
    'claude-sonnet-4-20250514',
    'claude-sonnet-4-reasoning-20250514',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
  ])
  .describe('Model to use for content generation')
  .placeholder(DefaultModel)
