import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const entities = {
  user: {
    title: 'User',
    description: 'A Telnyx user',
    schema: z
      .object({
        phoneNumber: z.string().describe('The phone number of the user').title('Phone Number'),
      })
      .title('User')
      .describe('The user object fields'),
  },
  conversation: {
    title: 'Conversation',
    description: 'A Telnyx conversation',
    schema: z
      .object({
        phoneNumber: z.string().describe('The phone number of the user').title('Phone Number'),
        telnyxNumber: z.string().describe('The Telnyx phone number the message was sent from').title('Telnyx Number'),
      })
      .title('Conversation')
      .describe('The conversation object fields'),
  },
} satisfies IntegrationDefinitionProps['entities']