import { z } from '@botpress/sdk'

export const publishMessageStreamInputSchema = z.object({
  conversationId: z.string().title('Conversation ID').describe('Botpress conversation ID for the message stream'),
  signal: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('delta'),
        streamId: z.string(),
        createdAt: z.string(),
        clientMessageId: z.string().optional(),
        sequence: z.number(),
        delta: z.string(),
      }),
      z.object({
        type: z.literal('abort'),
        streamId: z.string(),
      }),
    ])
    .title('Stream Signal')
    .describe('Transient message stream delta or abort signal'),
})
