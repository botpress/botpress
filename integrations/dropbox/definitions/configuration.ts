import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    dropboxAppKey: z.string().title('App Key').describe('The app key for the service'),
    dropboxAppSecret: z.string().title('App Secret').describe('The app secret for the service'),
    dropboxAccessToken: z.string().title('Access Token').describe('An access token for the service'),
  }),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']
