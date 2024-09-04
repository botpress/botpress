import { z } from '@botpress/sdk'
import { OutputMessageSchema } from '..'

export const updateCardOutputSchema = z.object({
  message: OutputMessageSchema,
})
