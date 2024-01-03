import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'
import { INTEGRATION_NAME } from './src/const'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '0.2.0',
  title: 'Messenger',
  description: 'This integration allows your bot to interact with Messenger.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    schema: z.object({
      appId: z.string(),
      appSecret: z.string(),
      verifyToken: z.string(),
      pageId: z.string(),
      accessToken: z.string(),
    }),
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    channel: {
      messages: messages.defaults,
      message: {
        tags: { id: {}, recipientId: {}, senderId: {} },
      },
      conversation: {
        tags: { id: {}, recipientId: {}, senderId: {} },
        creation: { enabled: true, requiredTags: ['id'] },
      },
    },
  },
  actions: {},
  events: {},
  states: {
    oauth: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    APP_ID: {
      description: 'App ID of the Meta app for Messenger bots',
    },
    APP_SECRET: {
      description: 'App Secret of the Meta app for Messenger bots',
    },
  },
  user: {
    tags: { id: {} },
    creation: { enabled: true, requiredTags: ['id'] },
  },
})
