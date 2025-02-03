/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'sunco',
  version: '0.5.1',
  title: 'Sunshine Conversations',
  description: 'Give your bot access to a powerful omnichannel messaging platform.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      appId: z.string().min(1),
      keyId: z.string().min(1),
      keySecret: z.string().min(1),
      webhookSecret: z.string().min(1),
    }),
  },
  channels: {
    channel: {
      messages: { ...messages.defaults, markdown: messages.markdown },
      message: { tags: { id: {} } },
      conversation: { tags: { id: {} }, creation: { enabled: true, requiredTags: ['id'] } },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: {},
    },
    creation: { enabled: true, requiredTags: ['id'] },
  },
}).extend(typingIndicator, () => ({ entities: {} }))
