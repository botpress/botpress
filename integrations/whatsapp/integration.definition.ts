import { IntegrationDefinition, messages } from '@botpress/sdk'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import { z } from 'zod'

export const name = 'whatsapp'
export const channel = 'channel' // TODO: Rename to "whatsapp" once support for integration versioning is finished.

export const PhoneNumberIdTag = 'phoneNumberId'
export const UserPhoneTag = 'userPhone'
export const TemplateNameTag = 'templateName'
export const TemplateLanguageTag = 'templateLanguage'
export const TemplateVariablesTag = 'templateVariables'

const TagsForCreatingConversation = {
  [PhoneNumberIdTag]: {
    title: 'Phone number ID',
    description: 'ID of the Whatsapp phone number to use as sender.',
  },
  [UserPhoneTag]: {
    title: 'User phone number',
    description: 'Phone number of the Whatsapp user to start the conversation with.',
  },
  [TemplateNameTag]: {
    title: 'Message template name',
    description: 'Name of the Whatsapp Message Template to start the conversation with.',
  },
  [TemplateLanguageTag]: {
    title: 'Message template language (optional)',
    description:
      'Language of the Whatsapp Message Template to start the conversation with. Defaults to "en_US" (U.S. English).',
  },
  [TemplateVariablesTag]: {
    title: 'Message template variables (optional)',
    description: 'JSON array representation of variable values to pass to the Whatsapp Message Template.',
  },
}

export default new IntegrationDefinition({
  name,
  version: '0.2.0',
  title: 'WhatsApp',
  description: 'This integration allows your bot to interact with WhatsApp.',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: z.object({
      verifyToken: z.string(),
      phoneNumberId: z.string(),
      accessToken: z.string(),
    }),
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
        creation: {
          enabled: true,
          requiredTags: [PhoneNumberIdTag, UserPhoneTag],
        },
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
        "Starts a conversation with a user's Whatsapp phone number by sending them a message using a Whatsapp Message Template.",
      input: {
        schema: z.object({
          userPhone: z.string().describe(TagsForCreatingConversation.userPhone.description),
          templateName: z.string().describe(TagsForCreatingConversation.templateName.description),
          templateLanguage: z.string().optional().describe(TagsForCreatingConversation.templateLanguage.description),
          templateVariablesJson: z
            .string()
            .optional()
            .describe(TagsForCreatingConversation.templateVariables.description),
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
  secrets: sentryHelpers.COMMON_SECRET_NAMES,
})
