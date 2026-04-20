import { z, IntegrationDefinitionProps } from '@botpress/sdk'

export const entities = {
  user: {
    title: 'User',
    description: 'A Twilio user',
    schema: z
      .object({
        userPhone: z.string().describe('The phone number of the user').title('User Phone Number'),
      })
      .title('User')
      .describe('The user object fields'),
  },
  conversation: {
    title: 'Conversation',
    description: 'A Twilio conversation',
    schema: z
      .object({
        userPhone: z.string().describe('The phone number of the user').title('User Phone Number'),
        activePhone: z.string().describe('The Phone number the message was sent from').title('Active Phone Number'),
      })
      .title('Conversation')
      .describe('The conversation object fields'),
  },
} satisfies IntegrationDefinitionProps['entities']
