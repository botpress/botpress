import * as sdk from '@botpress/sdk'

const SHARED_CONFIGURATION = {
  botAvatarUrl: sdk.z
    .string()
    .url()
    .optional()
    .title('Bot avatar URL')
    .describe("URL for the image used as the Slack bot's avatar"),
  botName: sdk.z.string().optional().title('Bot name').describe('Name displayed as the sender in Slack conversations'),
  typingIndicatorEmoji: sdk.z
    .boolean()
    .default(false)
    .title('Typing Indicator Emoji')
    .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
} as const

export const configuration = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: sdk.z.object(SHARED_CONFIGURATION),
} as const satisfies sdk.IntegrationDefinitionProps['configuration']

export const identifier = {
  extractScript: 'extract.vrl',
  fallbackHandlerScript: 'fallbackHandler.vrl',
} as const satisfies sdk.IntegrationDefinitionProps['identifier']

export const configurations = {
  botToken: {
    title: 'Manual configuration',
    description: 'Configure by manually supplying the bot token and signing secret',
    schema: sdk.z.object({
      botToken: sdk.z
        .string()
        .secret()
        .title('Slack Bot User OAuth Token')
        .describe('Available in the app admin panel under OAuth & Permissions'),
      signingSecret: sdk.z
        .string()
        .secret()
        .title('Slack Signing Secret')
        .describe('Available in the app admin panel under Basic Info'),
      ...SHARED_CONFIGURATION,
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
