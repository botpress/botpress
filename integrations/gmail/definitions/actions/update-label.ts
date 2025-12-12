import { z } from '@botpress/sdk'
import { ActionDef } from './types'

export const updateLabel = {
  title: 'Update Label',
  description: 'Updates the specified label with new properties like name or color.',
  input: {
    schema: z.object({
      id: z.string().title('Label ID').describe('The ID of the label to update.'),
      name: z.string().optional().title('Name').describe('The new display name for the label.'),
      backgroundColor: z
        .string()
        .optional()
        .title('Background Color')
        .describe('The background color as hex string (e.g., #ffffff).'),
      textColor: z.string().optional().title('Text Color').describe('The text color as hex string (e.g., #000000).'),
    }),
  },
  output: {
    schema: z.object({
      id: z.string().optional().title('Label ID').describe('The immutable ID of the label.'),
      name: z.string().optional().title('Name').describe('The display name of the label.'),
      type: z.string().optional().title('Type').describe('The owner type for the label (system or user).'),
      color: z
        .object({
          backgroundColor: z.string().optional().describe('The background color.'),
          textColor: z.string().optional().describe('The text color.'),
        })
        .optional()
        .title('Color')
        .describe('The color assigned to the label.'),
    }),
  },
} as const satisfies ActionDef
