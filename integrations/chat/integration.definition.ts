import * as sdk from '@botpress/sdk'
import { z } from '@botpress/sdk'
import { apiVersion } from './src/gen/version'

const metadata = z.record(z.any()).optional()
const text = { schema: sdk.messages.defaults.text.schema.extend({ metadata }) }
const image = { schema: sdk.messages.defaults.image.schema.extend({ metadata }) }
const audio = { schema: sdk.messages.defaults.audio.schema.extend({ metadata }) }
const video = { schema: sdk.messages.defaults.video.schema.extend({ metadata }) }
const file = { schema: sdk.messages.defaults.file.schema.extend({ metadata }) }
const location = { schema: sdk.messages.defaults.location.schema.extend({ metadata }) }
const carousel = { schema: sdk.messages.defaults.carousel.schema.extend({ metadata }) }
const card = { schema: sdk.messages.defaults.card.schema.extend({ metadata }) }
const dropdown = { schema: sdk.messages.defaults.dropdown.schema.extend({ metadata }) }
const choice = { schema: sdk.messages.defaults.choice.schema.extend({ metadata }) }
const bloc = { schema: sdk.messages.defaults.bloc.schema.extend({ metadata }) }
const markdown = { schema: sdk.messages.markdown.schema.extend({ metadata }) }

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
      messages: {
        text,
        image,
        audio,
        video,
        file,
        location,
        carousel,
        card,
        dropdown,
        choice,
        bloc,
        markdown,
      },
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
