import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import proactiveConversation from 'bp_modules/proactive-conversation'
import typingIndicator from 'bp_modules/typing-indicator'

export const INTEGRATION_NAME = 'whatsapp'

const commonConfigSchema = z.object({
  typingIndicatorEmoji: z
    .boolean()
    .default(false)
    .title('Typing Indicator Emoji')
    .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
})

const startConversationProps = {
  title: 'Start Conversation',
  description:
    'Proactively starts a conversation with a WhatsApp user by sending them a message using a WhatsApp Message Template',
  input: {
    schema: z.object({
      conversation: z.object({
        userPhone: z
          .string()
          .min(1)
          .title('User Phone Number')
          .describe('Phone number of the WhatsApp user to start a conversation with'),
        templateName: z
          .string()
          .min(1)
          .title('Message Template name')
          .describe('Name of the WhatsApp Message Template to start the conversation with'),
        templateLanguage: z
          .string()
          .optional()
          .title('Message Template language')
          .describe(
            'Language of the WhatsApp Message Template to start the conversation with. Defaults to "en_US" (U.S. English)'
          ),
        templateVariablesJson: z
          .string()
          .optional()
          .title('Message Template variables')
          .describe(
            'JSON array representation of variable values to pass to the WhatsApp Message Template (if required by the template)'
          ),
        botPhoneNumberId: z
          .string()
          .optional()
          .title('Bot Phone Number ID')
          .describe('Phone number ID to use as sender (uses the default phone number ID if not provided)'),
      }),
    }),
  },
}

const defaultBotPhoneNumberId = {
  title: 'Default Bot Phone Number ID',
  description: 'Default Phone ID used by the bot for starting conversations',
}

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '4.0.0',
  title: 'WhatsApp',
  description: 'Send and receive messages through WhatsApp.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configurations: {
    manualApp: {
      // TODO: Rename
      title: 'Manual Configuration',
      description: 'Manual Configuration, use your own Meta app (for advanced use cases only)',
      schema: z
        .object({
          verifyToken: z
            .string()
            .min(1)
            .secret()
            .title('Verify Token')
            .describe(
              'Token used for verification when subscribing to webhooks on the Meta app (type any random string)'
            ),
          accessToken: z
            .string()
            .min(1)
            .secret()
            .title('Access Token')
            .describe('Access Token from a System Account that has permission to the Meta app'),
          clientSecret: z
            .string()
            .secret()
            .optional()
            .title('Client Secret')
            .describe('Meta app secret used for webhook signature check'),
          defaultBotPhoneNumberId: z
            .string()
            .min(1)
            .title(defaultBotPhoneNumberId.title)
            .describe(defaultBotPhoneNumberId.description),
        })
        .merge(commonConfigSchema),
    },
  },
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
      required: true,
    },
    schema: commonConfigSchema,
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    whatsapp: {
      title: 'WhatsApp conversation',
      description: 'Conversation between a WhatsApp user and the bot',
      messages: {
        ...messages.defaults,
        file: {
          schema: messages.defaults.file.schema.extend({
            filename: z.string().optional(),
          }),
        },
      },
      message: {
        tags: {
          id: {
            title: 'Message ID',
            description: 'The WhatsApp message ID',
          },
        },
      },
      conversation: {
        tags: {
          botPhoneNumberId: {
            title: 'Bot Phone Number ID',
            description: 'WhatsApp Phone Number ID of the bot',
          },
          userPhone: {
            title: 'User Phone Number',
            description: 'Phone number of the WhatsApp user having a conversation with the bot.',
          },
        },
      },
    },
  },
  user: {
    tags: {
      userId: {
        title: 'User ID',
        description: 'WhatsApp user ID',
      },
      name: {
        title: 'Name',
        description: 'WhatsApp user display name',
      },
    },
  },
  actions: {
    startConversation: {
      ...startConversationProps,
      output: {
        schema: z.object({
          conversationId: z.string().title('Conversation ID').describe('ID of the conversation created'),
        }),
      },
    },
  },
  events: {},
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z
          .string()
          .optional()
          .title('Access token')
          .describe('Access token used to authenticate requests to the WhatsApp Business Platform API'),
        defaultBotPhoneNumberId: z
          .string()
          .optional()
          .title(defaultBotPhoneNumberId.title)
          .describe(defaultBotPhoneNumberId.description),
        wabaId: z
          .string()
          .optional()
          .title('WhatsApp Business Account ID')
          .describe('WhatsApp Business Account ID used to subscribe to webhook events'),
      }),
    },
  },
  secrets: {
    ...sentryHelpers.COMMON_SECRET_NAMES,
    CLIENT_ID: {
      description: 'The client ID of your Meta app.',
    },
    CLIENT_SECRET: {
      description: 'The client secret of your Meta app.',
    },
    ACCESS_TOKEN: {
      description: 'Access token for internal Meta App',
    },
    NUMBER_PIN: {
      // TODO: Global to the app? Remove if not necessary
      description: '6 Digits Pin used for phone number registration',
    },
    SEGMENT_KEY: {
      description: 'Tracking key for general product analytics',
      optional: true,
    },
    VERIFY_TOKEN: {
      description: 'The verify token for the Meta Webhooks subscription, optional since its only useful for oAuth.',
      optional: true,
    },
  },
  entities: {
    proactiveConversation: {
      title: 'Proactive Conversation',
      description: 'Proactive conversation with a WhatsApp user',
      schema: startConversationProps.input.schema.shape['conversation'],
    },
  },
})
  .extend(typingIndicator, () => ({ entities: {} }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.proactiveConversation,
    },
    actions: {
      getOrCreateConversation: {
        name: 'startConversation',
        title: startConversationProps.title,
        description: startConversationProps.description,
      },
    },
  }))

// TODO: Add a secret instead?
export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return '1535672497288913'
  }

  return '1620101672166859'
}
