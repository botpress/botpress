import { IntegrationDefinition } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

import { INTEGRATION_NAME } from './src/const'
import {
  addReaction,
  channel,
  dm,
  findTarget,
  retrieveMessage,
  startDmConversation,
  syncMembers,
  thread,
  userTags,
} from './src/definitions'

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  title: 'Slack',
  description: 'This integration allows your bot to interact with Slack.',
  version: '0.2.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    ui: {
      botName: {
        title: 'Bot Name (displayed as the sender in Slack conversations)',
      },
      botAvatarUrl: {
        title: "Bot Avatar URL (URL for the image used as the Slack bot's avatar)",
      },
    },
    schema: z.object({
      botToken: z.string().optional(), // TODO revert once the multiple configuration is available
      signingSecret: z.string().optional(), // TODO revert once the multiple configuration is available
      botAvatarUrl: z.string().url().optional(),
      botName: z.string().optional(),
    }),
  },
  states: {
    configuration: {
      type: 'integration',
      schema: z.object({
        botUserId: z.string().optional(),
      }),
    },
    sync: {
      type: 'integration',
      schema: z.object({
        usersLastSyncTs: z.number().optional(),
      }),
    },
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string(),
      }),
    },
  },
  channels: {
    channel,
    dm,
    thread,
  },
  actions: {
    addReaction,
    findTarget,
    retrieveMessage,
    syncMembers,
    startDmConversation,
  },
  events: {
    reactionAdded: {
      title: 'Reaction Added',
      description: 'Triggered when a reaction is added to a message',
      schema: z.object({
        reaction: z.string(),
        userId: z.string().optional(),
        conversationId: z.string().optional(),
        targets: z.object({
          dm: z.record(z.string()).optional(),
          channel: z.record(z.string()).optional(),
          thread: z.record(z.string()).optional(),
        }),
      }),
      ui: {},
    },
  },
  secrets: {
    CLIENT_ID: {
      description: 'The client ID of your Slack OAuth app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Slack OAuth app.',
    },
    ...sentryHelpers.COMMON_SECRET_NAMES,
  },
  user: {
    tags: userTags,
    creation: { enabled: true, requiredTags: ['id'] },
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
})
