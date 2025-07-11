import { z } from '@botpress/sdk'

export const DefaultModelId: ModelId = 'gemini-2.5-flash'

export const ModelId = z
  .enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'models/gemini-2.0-flash'])
  .describe('Model to use for content generation')
  .placeholder(DefaultModelId)
export type ModelId = z.infer<typeof ModelId>

export const DiscontinuedModelIds = [
  'models/gemini-1.5-flash-8b-001',
  'models/gemini-1.5-flash-002',
  'models/gemini-1.5-pro-002',
]
