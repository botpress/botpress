import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { messages } from './definitions/channels/messages'
import { apiVersion } from './src/gen/version'

export default new sdk.IntegrationDefinition({
  name: 'chat',
  title: 'Chat',
  version: apiVersion,
  readme: 'hub.md',
  icon: 'icon.svg',
  description: 'Chat integration for Botpress; Allows interacting with your bot using HTTP requests.',
  configuration: {
    schema: z.object({
      encryptionKey: z
        .string()
        .optional()
        .title('Encryption Key (HS256) - optional')
        .describe(
          'Only set this config if you plan on signing your user key yourself. Key used to sign and verify user keys; JWT tokens with HS256 algorithm.'
        ),
      webhookUrl: z
        .string()
        .optional()
        .title('Webhook URL - optional')
        .describe(
          'Only set this config if you want to listen on a webhook instead of the standard SSE stream. URL where all incoming and outgoing messages / events are sent to.'
        ),
      webhookSecret: z
        .string()
        .optional()
        .title('Webhook Secret - optional')
        .describe('Secret forwarded to the webhook URL.'),
    }),
  },
  events: {
    custom: {
      title: 'Custom Event',
      description: 'Custom event sent from the chat client to the bot',
      schema: z.object({
        userId: z.string(),
        conversationId: z.string(),
        payload: z.record(z.any()),
      }),
    },
  },
  actions: {
    sendEvent: {
      title: 'Send Custom Event',
      description: 'Send a custom event from the bot to the chat client',
      input: {
        schema: z.object({
          conversationId: z.string(),
          payload: z.record(z.any()),
        }),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
  channels: {
    channel: {
      conversation: {
        tags: {
          owner: { title: 'Conversation Owner', description: 'ID of the user who created the conversation' },
          fid: { title: 'fid', description: 'This tag is of no use and only exists for historical reasons' },
        },
      },
      messages,
      message: {
        tags: {
          fid: { title: 'fid', description: 'This tag is of no use and only exists for historical reasons' },
        },
      },
    },
  },
  user: {
    tags: {
      fid: { title: 'fid', description: 'This tag is of no use and only exists for historical reasons' },
      profile: {
        title: 'User Profile',
        description: 'Custom profile data of the user encoded as a string',
      },
    },
  },
  secrets: {
    SIGNAL_URL: {
      description: 'URL of the signal side of the realtime service',
      optional: false,
    },
    SIGNAL_SECRET: {
      description:
        'Secret used to authenticate with the signal service. If not provided, no authentication will be used',
      optional: true,
    },
    AUTH_ENCRYPTION_KEY: {
      description: 'Secret used to sign and verify JWT tokens',
      optional: false,
    },
    FID_STORE_CONFIG: {
      description: 'Base64 encoded JSON object containing the configuration for the foreign id store',
      optional: true,
    },
  },
})
