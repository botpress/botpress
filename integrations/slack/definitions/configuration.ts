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
  refreshToken: {
    title: 'Manual configuration',
    description: 'Configure by manually supplying the refresh token and signing secret',
    schema: sdk.z.object({
      refreshToken: sdk.z
        .string()
        .secret()
        .regex(/^xoxe[-]1/)
        .title('Slack Bot Refresh Token')
        .describe('Available in the app admin panel under OAuth & Permissions. Always starts with xoxe-1'),
      signingSecret: sdk.z
        .string()
        .secret()
        .title('Slack Signing Secret')
        .describe('Available in the app admin panel under Basic Info'),
      clientId: sdk.z.string().title('Slack Client ID').describe('Available in the app admin panel under Basic Info'),
      clientSecret: sdk.z
        .string()
        .secret()
        .title('Slack Client Secret')
        .describe('Available in the app admin panel under Basic Info'),
      ...SHARED_CONFIGURATION,
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
