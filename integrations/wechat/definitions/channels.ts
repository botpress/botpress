import { IntegrationDefinitionProps, messages } from '@botpress/sdk'

const _wechatMessageChannels = {
  text: {
    ...messages.defaults.text,
    schema: messages.defaults.text.schema.extend({
      text: messages.defaults.text.schema.shape.text
        .max(4096)
        .describe('The text content of the WeChat message (Limit 4096 characters)'),
    }),
  },
  image: messages.defaults.image,
  video: messages.defaults.video,
}

export const channels = {
  channel: {
    title: 'Channel',
    description: 'WeChat Channel',
    messages: _wechatMessageChannels,
    message: {
      tags: {
        id: { title: 'ID', description: 'The message ID' },
        chatId: { title: 'Chat ID', description: 'The message chat ID' },
      },
    },
    conversation: {
      tags: {
        id: { title: 'ID', description: 'The conversation ID' },
        fromUserId: { title: 'WeChat User ID', description: 'The conversation WeChat user ID' },
        chatId: { title: 'Chat ID', description: 'The conversation chat ID' },
      },
    },
  },
} as const satisfies IntegrationDefinitionProps['channels']
