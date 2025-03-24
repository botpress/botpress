/* bplint-disable */
import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import proactiveUser from 'bp_modules/proactive-user'
import typingIndicator from 'bp_modules/typing-indicator'

export default new IntegrationDefinition({
  name: 'sunco',
  version: '1.0.0',
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
      conversation: { tags: { id: {} } },
    },
  },
  actions: {},
  events: {},
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
  user: {
    tags: {
      id: {},
    },
  },
  entities: {
    user: {
      title: 'User',
      description: 'A Sunshine Conversations user',
      schema: z
        .object({
          id: z.string().title('ID').describe('The Sunshine Conversations user ID'),
        })
        .title('User')
        .describe('The user object fields'),
    },
    conversation: {
      title: 'Conversation',
      description: 'A Sunshine Conversations conversation',
      schema: z
        .object({
          id: z.string().title('ID').describe('The Sunshine Conversations conversation ID'),
        })
        .title('Conversation')
        .describe('The conversation object fields'),
    },
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
  .extend(proactiveUser, ({ entities }) => ({
    entities: {
      user: entities.user,
    },
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
  }))
