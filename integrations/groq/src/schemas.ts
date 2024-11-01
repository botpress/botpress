import { z } from '@botpress/sdk'

export const modelId = z
  .enum([
    'llama-3.2-1b-preview',
    'llama-3.2-3b-preview',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview',
    'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile',
    'llama3-8b-8192',
    'llama3-70b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
    'gemma2-9b-it',
  ])
  .describe('Model to use for content generation')
  .placeholder('mixtral-8x7b-32768')

export type ModelId = z.infer<typeof modelId>

export const speechToTextModelId = z.enum(['whisper-large-v3', 'whisper-large-v3-turbo', 'distil-whisper-large-v3-en'])
export type SpeechToTextModelId = z.infer<typeof speechToTextModelId>
