import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const changeMessageLabels = {
  title: 'Change Message Labels',
  description: 'Modifies the labels on the specified message by adding or removing label IDs.',
  input: {
    schema: z.object({
      id: z.string().title('Message ID').describe('The ID of the message to modify.'),
      addLabelIds: z
        .array(z.string())
        .optional()
        .title('Add Label IDs')
        .describe('A list of IDs of labels to add to this message.'),
      removeLabelIds: z
        .array(z.string())
        .optional()
        .title('Remove Label IDs')
        .describe('A list of IDs of labels to remove from this message.'),
    }),
  },
  output: {
    schema: z.object({}).title('Empty').describe('Empty output'),
  },
} as const satisfies ActionDef
