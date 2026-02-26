import { z, IntegrationDefinition } from '@botpress/sdk'
import { channels, user } from 'definitions'

export default new IntegrationDefinition({
  name: 'wechat',
  title: 'WeChat',
  description: 'Engage with your WeChat audience in real-time.',
  version: '0.1.0',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      appId: z.string().title('App ID').describe('WeChat Official Account App ID'),
      appSecret: z.string().title('App Secret').describe('WeChat Official Account App Secret'),
      webhookSigningSecret: z
        .string()
        .title('WeChat Token')
        .describe('WeChat Token used for webhook signature verification'),
    }),
  },
  channels,
  user,
})
