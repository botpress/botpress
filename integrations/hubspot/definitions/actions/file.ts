import { z, ActionDefinition } from '@botpress/sdk'

const getFileSignedUrl: ActionDefinition = {
  title: 'Get File Signed URL',
  description: 'Get a signed URL to access a file stored in Hubspot Files',
  input: {
    schema: z.object({
      fileId: z.string().title('File ID').describe('The ID of the Hubspot file'),
      expirationSeconds: z
        .number()
        .int()
        .optional()
        .title('Expiration Seconds')
        .describe('How long the signed URL should remain valid, in seconds'),
    }),
  },
  output: {
    schema: z.object({
      url: z.string().nullable().title('URL').describe('The signed URL of the file, or null if not available'),
      name: z.string().optional().title('Name').describe('The name of the file'),
      extension: z.string().optional().title('Extension').describe('The file extension'),
      type: z.string().optional().title('Type').describe('The MIME type of the file'),
      size: z.number().optional().title('Size').describe('The size of the file in bytes'),
      expiresAt: z
        .string()
        .optional()
        .title('Expires At')
        .describe('The date and time at which the signed URL expires'),
    }),
  },
}

export const actions = {
  getFileSignedUrl,
} as const
