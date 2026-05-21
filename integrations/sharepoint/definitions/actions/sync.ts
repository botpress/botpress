import { z } from '@botpress/sdk'

export const addToSync = {
  title: 'Add Libraries to Sync',
  description: 'Register additional SharePoint document libraries for real-time sync without re-deploying.',
  input: {
    schema: z.object({
      documentLibraryNames: z
        .string()
        .min(1)
        .title('Document Library Names')
        .describe('Libraries to add. Formats: single name, comma-separated, or JSON array.'),
    }),
  },
  output: {
    schema: z.object({
      success: z.boolean().title('Success').describe('True if at least one library was added successfully.'),
    }),
  },
}
