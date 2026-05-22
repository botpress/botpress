import { z } from '@botpress/sdk'

export const addToSync = {
  title: 'Add Libraries to Sync',
  description: 'Register additional SharePoint document libraries for real-time sync without re-deploying.',
  input: {
    schema: z.object({
      documentLibraryNames: z.string().array().min(1).title('Document Library Names').describe('Libraries to add.'),
    }),
  },
  output: {
    schema: z.object({}),
  },
}
