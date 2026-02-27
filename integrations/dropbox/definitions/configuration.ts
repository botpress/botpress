import { z } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'

export const configuration = {
  identifier: { linkTemplateScript: 'linkTemplate.vrl', required: false },
  schema: z.object({}),
} satisfies sdk.IntegrationDefinitionProps['configuration']

export const configurations = {
  manual: {
    title: 'Manual Configuration',
    description: 'Configure the Dropbox integration manually using your own app.',
    schema: z.object({
      clientId: z.string().title('App Key').describe('Available in the App Console on Dropbox'),
      clientSecret: z.string().title('App Secret').describe('Available in the App Console on Dropbox').secret(),
      authorizationCode: z
        .string()
        .title('Access Code')
        .describe('Obtained by navigating to the authorization URL')
        .secret(),
    }),
  },
} satisfies sdk.IntegrationDefinitionProps['configurations']
