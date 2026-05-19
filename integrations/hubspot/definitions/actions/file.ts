import { z, ActionDefinition } from '@botpress/sdk'

const getFileUrl: ActionDefinition = {
  title: 'Get File URL',
  description: 'Get a URL to access a file stored in Hubspot Files',
  input: {
    schema: z.object({
      fileName: z.string().title('File path').describe('The path to the Hubspot file'),
    }),
  },
  output: {
    schema: z.object({
      url: z.string().optional().title('URL').describe('The URL of the file, or undefined if not available'),
    }),
  },
}

export const actions = {
  getFileUrl,
} as const
