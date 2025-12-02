import { z } from '@botpress/sdk'

export const languageModelId = z
  .string()
  .describe('Model to use for content generation')
  .placeholder('gpt-4o-mini-2024-07-18')
export type LanguageModelId = z.infer<typeof languageModelId>

export const imageModelId = z.enum([
  'dall-e-3-standard-1024',
  'dall-e-3-standard-1792',
  'dall-e-3-hd-1024',
  'dall-e-3-hd-1792',
  'dall-e-2-256',
  'dall-e-2-512',
  'dall-e-2-1024',
])
export type ImageModelId = z.infer<typeof imageModelId>

export const speechToTextModelId = z.enum(['whisper-1'])
export type SpeechToTextModelId = z.infer<typeof speechToTextModelId>
