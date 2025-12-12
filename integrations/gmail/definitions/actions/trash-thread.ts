import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const trashThread = {
  title: 'Trash Thread',
  description:
    'Moves the specified thread to the trash. All messages in the thread will be moved to trash. The thread can be restored using untrashThread.',
  input: {
    schema: z.object({
      id: z.string().title('Thread ID').describe('The ID of the thread to trash.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
