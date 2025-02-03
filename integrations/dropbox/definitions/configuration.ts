import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    clientId: z.string().title('App Key').describe('Available in the App Console on Dropbox'),
    clientSecret: z.string().title('App Secret').describe('Available in the App Console on Dropbox').secret(),
    accessToken: z
      .string()
      .title('Access Token')
      .describe('You can generate one in the App Console on Dropbox')
      .secret(),
  }),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']
