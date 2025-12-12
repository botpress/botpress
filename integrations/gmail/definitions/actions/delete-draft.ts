import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const deleteDraft = {
  title: 'Delete Draft',
  description: 'Immediately and permanently deletes the specified draft. This operation cannot be undone.',
  input: {
    schema: z.object({
      id: z.string().title('Draft ID').describe('The ID of the draft to delete.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
