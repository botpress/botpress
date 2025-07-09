import { z } from '@botpress/sdk'

export const languageModelId = z
  .enum(['gemini-2.5-flash', 'gemini-2.5-pro', 'models/gemini-2.0-flash'])
  .describe('Model to use for content generation')
  .placeholder('gemini-2.5-flash')
export type LanguageModelId = z.infer<typeof languageModelId>
