import { z } from '@botpress/sdk'

export const baseIdentifierSchema = z
  .object({
    workspace_id: z.string().title('Workspace ID').describe('The Attio workspace ID'),
    object_id: z.string().title('Object ID').describe('The Attio object ID'),
  })
  .title('Record Identifier')
