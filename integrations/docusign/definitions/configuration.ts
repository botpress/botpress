import { z } from '@botpress/sdk'

export const configurationSchema = z.object({
  accountId: z
    .string()
    .optional()
    .title('API Account ID (Optional)')
    .describe(
      'The docusign user\'s "API Account ID" (This is a GUID that is found in "Apps & Keys")\nThe default account will be selected if left empty'
    )
    .placeholder('e.g. a1b2c3d4-e5f6-g7h8-i9j0-d4c3b2a1'),
})
