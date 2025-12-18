import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const untrashMessage = {
  title: 'Untrash Message',
  description: 'Removes the specified message from the trash and restores it to the inbox.',
  input: {
    schema: z.object({
      id: z.string().title('Message ID').describe('The ID of the message to untrash.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
