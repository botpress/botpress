import { z } from '@botpress/sdk'
import { OutputMessageSchema } from '..'

export const moveCardDownOutputSchema = z.object({
  message: OutputMessageSchema,
})
