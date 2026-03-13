import { z } from '@botpress/sdk'

export const ttsModelId = z
  .enum(['mars-flash', 'mars-pro', 'mars-instruct'])
  .describe('MARS model to use for text-to-speech')
  .placeholder('mars-flash')
export type TtsModelId = z.infer<typeof ttsModelId>
