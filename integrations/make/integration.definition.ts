/* bplint-disable */
import { z, IntegrationDefinition } from '@botpress/sdk'

const INTEGRATION_NAME = 'make'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.3.5',
  title: 'Make.com (Deprecated)',
  icon: 'icon.svg',
  description:
    'Automate tasks, sync data across multiple applications, and enhance the capabilities of your chatbot like never before.',
  readme: 'hub.md',
  configuration: {
    schema: z
      .object({
        webhookUrl: z.string().url().describe('Make.com webhook URL'),
      })
      .describe('Configuration schema for Make.com Integration'),
  },
  channels: {},
  actions: {
    sendData: {
      description: 'Send Data as a JSON string',
      title: 'Send Data',
      input: {
        schema: z.object({
          data: z
            .string()
            .min(1, { message: 'Must not be empty' })
            .describe('JSON string of data to send')
            .title('Data'),
        }),
      },
      output: {
        schema: z.object({
          success: z.boolean().describe('True if the data was sent successfully').title('Success'),
          response: z
            .any()
            .describe(
              'Data received from Make.com, will be the string `Accepted` if successful and no data is returned'
            )
            .title('Response')
            .nullable(),
        }),
      },
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
