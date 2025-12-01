import { default as sdk, z } from '@botpress/sdk'

export const actions = {
  trigger: {
    title: 'Trigger',
    description: 'Trigger a Zapier webhook',
    input: {
      schema: z.object({
        data: z
          .string()
          .placeholder('{ "message": "Hello Zapier!" }')
          .describe('The data you want to send to Zapier trigger. Can be any string including JSON.')
          .title('Trigger Data to send to Zapier'),
        correlationId: z
          .string()
          .title('Correlation ID')
          .describe('Can be used to receive a response back from Zapier by listening for an `event.correlationId`')
          .optional(),
      }),
    },
    output: {
      schema: z.object({}),
    },
  },
} as const satisfies sdk.IntegrationDefinitionProps['actions']
