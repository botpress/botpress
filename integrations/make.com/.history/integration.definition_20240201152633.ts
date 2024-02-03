import { IntegrationDefinition, messages } from '@botpress/sdk'
import { z } from 'zod'

const INTEGRATION_NAME = "makecom"

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      webhookURL: z.string().describe('Make.com webhook URL').url(),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults },
    },
  },
  actions: {
    sendData: {
      input: {
        schema: z.object({
          data: z.string().describe("This should be a JSON string")
        })
      },
      output: {
        schema: z.object({ response: z.string() })
      }
    }
  },
})