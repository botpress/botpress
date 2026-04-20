import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const trashMessage = {
  title: 'Trash Message',
  description:
    'Moves the specified message to the trash. The message can be restored from the trash using untrashMessage.',
  input: {
    schema: z.object({
      id: z.string().title('Message ID').describe('The ID of the message to trash.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
