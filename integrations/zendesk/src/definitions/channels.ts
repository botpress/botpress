import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

export const channels = {
  messaging: {
    title: 'Zendesk Messaging Channel',
    description: 'Channel for Zendesk Messaging (Sunshine Conversations) conversations',
    messages: { ...messages.defaults, markdown: messages.markdown },
    message: {
      tags: {
        id: {
          title: 'Message ID',
          description: 'The Sunshine Conversations message ID',
        },
      },
    },
    conversation: {
      tags: {
        id: {
          title: 'Conversation ID',
          description: 'The Sunshine Conversations conversation ID',
        },
      },
    },
  },
} satisfies IntegrationDefinitionProps['channels']
