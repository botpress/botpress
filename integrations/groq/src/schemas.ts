import { z } from '@botpress/sdk'

export const modelId = z
  .enum([
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'deepseek-r1-distill-llama-70b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ])
  .describe('Model to use for content generation')
  .placeholder('openai/gpt-oss-120b')

export type ModelId = z.infer<typeof modelId>

export const speechToTextModelId = z.enum(['whisper-large-v3', 'whisper-large-v3-turbo', 'distil-whisper-large-v3-en'])
export type SpeechToTextModelId = z.infer<typeof speechToTextModelId>
