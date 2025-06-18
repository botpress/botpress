import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'
import { sendMailInputSchema } from './src/misc/custom-schemas'

export default new IntegrationDefinition({
  name: integrationName,
  title: 'SendGrid',
  version: '0.0.1',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      apiKey: z.string().min(1).describe('Your SendGrid API Key'),
    }),
  },
  actions: {
    sendMail: {
      title: 'Send Email',
      description: 'Sends an email to the specified client',
      input: {
        schema: sendMailInputSchema,
      },
      output: {
        schema: z.object({
          // As far as I can tell, there is no response body
          // when the request is successfully processed (Status 202)
        }),
      },
    },
  },
})
