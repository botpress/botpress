import { z } from '@botpress/sdk'
import { OutputMessageSchema } from '..'

export const moveCardToListOutputSchema = z.object({
  message: OutputMessageSchema,
})
