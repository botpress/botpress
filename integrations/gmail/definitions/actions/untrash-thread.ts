import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const untrashThread = {
  title: 'Untrash Thread',
  description: 'Removes the specified thread from the trash. All messages in the thread will be restored.',
  input: {
    schema: z.object({
      id: z.string().title('Thread ID').describe('The ID of the thread to restore from trash.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
