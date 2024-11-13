/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

export default new IntegrationDefinition({
  name: 'intercom',
  version: '0.4.6',
  title: 'Intercom',
  description: 'Engage with customers in realtime with personalized messaging.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      accessToken: z.string().min(1),
      adminId: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: {
          id: {},
        },
        creation: { enabled: true, requiredTags: ['id'] },
      },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: { id: {}, email: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
