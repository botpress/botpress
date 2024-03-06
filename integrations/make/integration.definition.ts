import { IntegrationDefinition } from '@botpress/sdk'
import { z } from 'zod'

const INTEGRATION_NAME = 'make'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Make.com',
  icon: 'icon.svg',
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
            data: z.string().min(1, { message: 'Must not me empty' }).describe('JSON string of data to send'),
          })
          .describe('Input schema for sending data'),
      },
      output: {
        schema: z
          .object({
            success: z.boolean().describe('True if the data was sent successfully'),
            response: z
              .object({
                data: z
                  .any()
                  .describe(
                    'Data received from Make.com, will be the string `Accepted` if successful and no data is returned'
                  ),
              })
              .nullable(),
          })
          .describe('Output schema after sending data, expecting any JSON structure'),
      },
    },
  },
})
