import { z, IntegrationDefinition } from '@botpress/sdk'
import { wechatMessageChannels } from './definitions/channels'
export default new IntegrationDefinition({
  name: 'wechat',
  version: '1.0.0',
  title: 'WeChat',
  description: 'Engage with your WeChat audience in real-time.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      wechatToken: z.string().min(1).describe('Token used for WeChat signature verification').title('WeChat Token'),
      appId: z.string().min(1).describe('WeChat Official Account App ID').title('App ID'),
      appSecret: z.string().min(1).describe('WeChat Official Account App Secret').title('App Secret'),
    }),
  },
  channels: {
    channel: {
      title: 'Channel',
      description: 'WeChat Channel',
      messages: wechatMessageChannels,
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
  },
  actions: {},
  events: {},
  user: {
    tags: {
      id: { title: 'ID', description: 'The ID of the user' },
    },
  },
})
