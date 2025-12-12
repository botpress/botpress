import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const createLabel = {
  title: 'Create Label',
  description: "Creates a new label in the user's mailbox.",
  input: {
    schema: z.object({
      name: z.string().title('Name').describe('The display name of the label to create.'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Label ID').describe('The immutable ID of the created label.'),
      name: z.string().optional().title('Name').describe('The display name of the label.'),
      type: z.string().optional().title('Type').describe('The owner type for the label (system or user).'),
    }),
  },
} as const satisfies ActionDef
