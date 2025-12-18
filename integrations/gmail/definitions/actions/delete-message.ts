import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteMessage = {
  title: 'Delete Message',
  description:
    'Immediately and permanently deletes the specified message using its ID. This operation cannot be undone. Prefer messages.trash instead',
  input: {
    schema: z.object({
      id: z.string().title('Message ID').describe('The ID of the message to delete.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
