import { z } from '@botpress/sdk'

export const languageModelId = z
  .enum([
    'accounts/fireworks/models/deepseek-r1',
    'accounts/fireworks/models/deepseek-v3',
    'accounts/fireworks/models/llama-v3p1-405b-instruct',
    'accounts/fireworks/models/llama-v3p1-70b-instruct',
    'accounts/fireworks/models/llama-v3p1-8b-instruct',
    'accounts/fireworks/models/mixtral-8x22b-instruct',
    'accounts/fireworks/models/mixtral-8x7b-instruct',
    'accounts/fireworks/models/firefunction-v2',
    'accounts/fireworks/models/firellava-13b',
    'accounts/fireworks/models/deepseek-coder-v2-instruct',
    'accounts/fireworks/models/deepseek-coder-v2-lite-instruct',
    'accounts/fireworks/models/mythomax-l2-13b',
    'accounts/fireworks/models/qwen2-72b-instruct',
    'accounts/fireworks/models/gemma2-9b-it',
  ])
  .describe('Model to use for content generation')
  .placeholder('accounts/fireworks/models/llama-v3p1-70b-instruct')
export type LanguageModelId = z.infer<typeof languageModelId>

export const imageModelId = z.enum([
  'accounts/fireworks/models/stable-diffusion-xl-1024-v1-0',
  'accounts/stability/models/sd3',
  'accounts/stability/models/sd3-medium',
  'accounts/fireworks/models/playground-v2-5-1024px-aesthetic',
  'accounts/fireworks/models/playground-v2-5-1024px-aesthetic',
])
export type ImageModelId = z.infer<typeof imageModelId>

export const speechToTextModelId = z.enum(['whisper-v3'])
export type SpeechToTextModelId = z.infer<typeof speechToTextModelId>
