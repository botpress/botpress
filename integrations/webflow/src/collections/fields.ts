import { z } from '@botpress/sdk'
//TODO add metadata

export const fieldSchemas = z.object({
  type: z.enum([
    'Color',
    'DateTime',
    'Email',
    'File',
    'Image',
    'Link',
    'Multimage',
    'Number',
    'Phone',
    'PlainText',
    'RichText',
    'Switch',
    'VideoLink',
  ]),
  displayName: z.string().min(1, 'Display Name is required').describe('The display name of the field'),
  isRequired: z.boolean().optional().describe('Whether the field is required'),
  helpText: z.string().optional().describe('Help text for the field'),
})
