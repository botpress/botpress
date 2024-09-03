import { z } from '@botpress/sdk'
import { OutputMessageSchema } from '..'

export const moveCardUpOutputSchema = z.object({
  message: OutputMessageSchema,
})
