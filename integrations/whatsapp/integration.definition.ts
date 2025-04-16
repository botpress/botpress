import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import typingIndicator from 'bp_modules/typing-indicator'

export const channel = 'channel' // TODO: Rename to "whatsapp" once support for integration versioning is finished.

const TagsForCreatingConversation = {
  phoneNumberId: {
    title: 'Phone Number ID',
    description:
      'Whatsapp Phone Number ID to use as sender. If not provided it defaults to the one set in the configuration.',
  },
  userPhone: {
    title: 'User phone number',
    description: 'Phone number of the Whatsapp user to start the conversation with.',
  },
  templateName: {
    title: 'Message Template name',
    description: 'Name of the Whatsapp Message Template to start the conversation with.',
  },
  templateLanguage: {
    title: 'Message Template language (optional)',
    description:
      'Language of the Whatsapp Message Template to start the conversation with. Defaults to "en_US" (U.S. English).',
  },
  templateVariables: {
    title: 'Message Template variables (optional)',
    description: 'JSON array representation of variable values to pass to the Whatsapp Message Template.',
  },
}

export const INTEGRATION_NAME = 'whatsapp'

const commonConfigSchema = z.object({
  typingIndicatorEmoji: z
    .boolean()
    .default(false)
    .title('Typing Indicator Emoji')
    .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
})

export default new IntegrationDefinition({
  name: INTEGRATION_NAME,
  version: '3.0.1', // TODO: Bump major
  title: 'WhatsApp',
  description: 'Send and receive messages through WhatsApp.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configurations: {
    manualApp: {
      // TODO: Rename
      title: 'Manual Configuration',
      description: 'Manual Configuration, use your own Meta app (for advanced use cases only)',
      ui: {
        phoneNumberId: {
          title: 'Default Phone Number ID for starting conversations',
        },
      },
      schema: z
        .object({
          verifyToken: z
            .string()
            .min(1)
            .title('Verify Token')
            .describe(
              'Token used for verification when subscribing to webhooks on the Meta app (type any random string)'
            ),
          accessToken: z
            .string()
            .min(1)
            .title('Access Token')
            .describe('Access Token from a System Account that has permission to the Meta app'),
          clientSecret: z
            .string()
            .optional()
            .title('Client Secret')
            .describe('Meta app secret used for webhook signature check'),
          phoneNumberId: z
            .string()
            .min(1)
            .title('Phone Number ID')
            .describe('Default Phone id used for starting conversations'),
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
    [channel]: {
      title: 'WhatsApp conversation',
      description: 'Conversation between a WhatsApp user and the bot',
      messages: {
        ...messages.defaults,
        markdown: messages.markdown, // TODO: Remove
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
        tags: TagsForCreatingConversation,
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
      title: 'Start Conversation',
      description:
        "Proactively starts a conversation with a user's Whatsapp phone number by sending them a message using a Whatsapp Message Template.",
      input: {
        schema: z.object({
          userPhone: z
            .string()
            .title(TagsForCreatingConversation.userPhone.title)
            .describe(TagsForCreatingConversation.userPhone.description),
          templateName: z
            .string()
            .title(TagsForCreatingConversation.templateName.title)
            .describe(TagsForCreatingConversation.templateName.description),
          templateLanguage: z
            .string()
            .optional()
            .title(TagsForCreatingConversation.templateLanguage.title)
            .describe(TagsForCreatingConversation.templateLanguage.description),
          templateVariablesJson: z
            .string()
            .optional()
            .title(TagsForCreatingConversation.templateVariables.title)
            .describe(TagsForCreatingConversation.templateVariables.description),
          senderPhoneNumberId: z
            .string()
            .optional()
            .title(TagsForCreatingConversation.phoneNumberId.title)
            .describe(TagsForCreatingConversation.phoneNumberId.description),
        }),
      },
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
        phoneNumberId: z
          .string()
          .optional()
          .title('Phone Number ID')
          .describe('WhatsApp Phone Number ID to use as sender'),
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
}).extend(typingIndicator, () => ({ entities: {} }))

// TODO: Add a secret instead?
export const getOAuthConfigId = () => {
  if (process.env.BP_WEBHOOK_URL?.includes('dev')) {
    return '1535672497288913'
  }

  return '1620101672166859'
}
