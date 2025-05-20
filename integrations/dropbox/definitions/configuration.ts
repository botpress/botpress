import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const configuration = {
  schema: z.object({
    clientId: z.string().title('App Key').describe('Available in the App Console on Dropbox'),
    clientSecret: z.string().title('App Secret').describe('Available in the App Console on Dropbox').secret(),
    authorizationCode: z
      .string()
      .title('Access Code')
      .describe('Obtained by navigating to the authorization URL')
      .secret(),
  }),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']
