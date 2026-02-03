import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  channel: {
    title: 'Conversation Channel',
    description: 'A channel for sending and receiving messages through Twilio Conversations',
    messages: { ...messages.defaults, bloc: messages.markdownBloc },
    message: {
      tags: {
        id: {
          title: 'Message ID',
          description: 'The Twilio message ID',
        },
      },
    },
    conversation: {
      tags: {
        userPhone: {
          title: 'User Phone',
          description: 'The phone number of the user',
        },
        activePhone: {
          title: 'Active Phone',
          description: 'The phone number of the active user',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
