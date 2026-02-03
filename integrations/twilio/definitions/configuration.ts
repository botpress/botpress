import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    accountSID: z.string().min(1).describe('The account SID').title('Account SID'),
    authToken: z.string().min(1).describe('The token for authentication').title('Authorization token'),
    downloadMedia: z
      .boolean()
      .default(true)
      .title('Download Media')
      .describe(
        'Automatically download media files using the Files API for content access. If disabled, temporary Twilio media URLs will be used, which require authentication.'
      ),
    downloadedMediaExpiry: z
      .number()
      .default(24)
      .optional()
      .title('Downloaded Media Expiry')
      .describe(
        'Expiry time in hours for downloaded media files. An expiry time of 0 means the files will never expire.'
      ),
  }),
} satisfies IntegrationDefinitionProps['configuration']
