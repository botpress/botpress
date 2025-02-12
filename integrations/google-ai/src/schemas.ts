import { z } from '@botpress/sdk'

export const languageModelId = z
  .enum([
    'models/gemini-2.0-flash',
    'models/gemini-1.5-flash-8b-001',
    'models/gemini-1.5-flash-002',
    'models/gemini-1.5-pro-002',
  ])
  .describe('Model to use for content generation')
  .placeholder('models/gemini-1.5-flash-002')
export type LanguageModelId = z.infer<typeof languageModelId>
