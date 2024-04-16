import { z, IntegrationDefinition } from '@botpress/sdk'

const INTEGRATION_NAME = 'make'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.3.0',
  title: 'Make.com',
  icon: 'icon.svg',
  description:
    'Seamlessly connect your Botpress chatbot with Make.com to unlock a world of possibilities. Automate tasks, sync data across multiple applications, and enhance the capabilities of your chatbot like never before',
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
      input: {
        schema: z
          .object({
            data: z.string().min(1, { message: 'Must not be empty' }).describe('JSON string of data to send'),
          })
          .describe('Input schema for sending data'),
      },
      output: {
        schema: z
          .object({
            success: z.boolean().describe('True if the data was sent successfully'),
            response: z
              .any()
              .describe(
                'Data received from Make.com, will be the string `Accepted` if successful and no data is returned'
              )
              .nullable(),
          })
          .describe('Output schema after sending data, expecting any JSON structure'),
      },
    },
  },
})
