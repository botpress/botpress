import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteLabel = {
  title: 'Delete Label',
  description:
    'Immediately and permanently deletes the specified label. Messages and threads are not deleted, they simply lose this label.',
  input: {
    schema: z.object({
      id: z.string().title('Label ID').describe('The ID of the label to delete.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
