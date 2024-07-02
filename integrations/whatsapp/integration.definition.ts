import { z, IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'

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

export default new IntegrationDefinition({
  name: 'whatsapp',
  version: '2.0.1',
  title: 'WhatsApp',
  description: 'This integration allows your bot to interact with WhatsApp.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    identifier: {
      linkTemplateScript: 'linkTemplate.vrl',
    },
    ui: {
      phoneNumberId: {
        title: 'Default Phone Number ID for starting conversations',
      },
      useManualConfiguration: {
        title: 'Use Manual Configuration',
      },
    },
    schema: z.object({
      useManualConfiguration: z.boolean().optional().describe('Skip oAuth and supply details from a Meta App'),
      verifyToken: z.string().min(1).optional().describe('Token used for verification when subscribing to webhooks'),
      accessToken: z
        .string()
        .min(1)
        .optional()
        .describe('Access Token from a System Account that has permission to the Meta app'),
      clientSecret: z.string().min(1).optional().describe('Meta app secret used for webhook signature check'),
      phoneNumberId: z.string().min(1).optional().describe('Default Phone used for starting conversations'),
    }),
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  channels: {
    [channel]: {
      messages: messages.defaults,
      message: {
        tags: {
          id: {},
        },
      },
      conversation: {
        tags: TagsForCreatingConversation,
      },
    },
  },
  user: {
    tags: {
      userId: {},
      name: {},
    },
  },
  actions: {
    startConversation: {
      title: 'Start Conversation',
      description:
        "Proactively starts a conversation with a user's Whatsapp phone number by sending them a message using a Whatsapp Message Template.",
      input: {
        schema: z.object({
          userPhone: z.string().describe(TagsForCreatingConversation.userPhone.description),
          templateName: z.string().describe(TagsForCreatingConversation.templateName.description),
          templateLanguage: z.string().optional().describe(TagsForCreatingConversation.templateLanguage.description),
          templateVariablesJson: z
            .string()
            .optional()
            .describe(TagsForCreatingConversation.templateVariables.description),
          senderPhoneNumberId: z.string().optional().describe(TagsForCreatingConversation.phoneNumberId.description),
        }),
      },
      output: {
        schema: z.object({
          conversationId: z.string(),
        }),
      },
    },
  },
  events: {},
  states: {
    credentials: {
      type: 'integration',
      schema: z.object({
        accessToken: z.string().optional(),
        phoneNumberId: z.string().optional(),
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
      description: '6 Digits Pin used for phone number registration',
    },
  },
})
