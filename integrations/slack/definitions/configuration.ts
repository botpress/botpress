import * as sdk from '@botpress/sdk'

const SHARED_CONFIGURATION = {
  botAvatarUrl: sdk.z
    .string()
    // .url() // Uncomment this once either the studio bug of not allowing empty strings is fixed, or the ".or()" in zui/studio is supported.
    .optional()
    .title('Bot avatar URL')
    .describe("URL for the image used as the Slack bot's avatar"),
  botName: sdk.z.string().optional().title('Bot name').describe('Name displayed as the sender in Slack conversations'),
  typingIndicatorEmoji: sdk.z
    .boolean()
    .default(false)
    .title('Typing Indicator Emoji')
    .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
  replyBehaviour: sdk.z
    .object({
      location: sdk.z
        .enum(['channel', 'thread', 'channelAndThread'])
        .default('channel')
        .title('Reply Location')
        .describe('Where the bot sends replies: Channel only, Thread only (creates if needed), or both'),
      onlyOnBotMention: sdk.z
        .boolean()
        .default(false)
        .title('Require Bot Mention for Replies')
        .describe('This ensures that the bot only replies to messages when it is explicitly mentioned'),
    })
    .optional()
    .title('Reply Behaviour')
    .describe('How the bot should reply to messages'),
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
    identifier: {
      linkTemplateScript: 'wizardHandler.vrl',
    },
    schema: sdk.z.object({
      ...SHARED_CONFIGURATION,
    }),
  },
  manifestAppCredentials: {
    title: 'App Manifest (Automatic Setup)',
    description: 'Register new Slack application',
    identifier: {
      linkTemplateScript: 'wizardHandler.vrl',
    },
    schema: sdk.z.object({
      ...SHARED_CONFIGURATION,
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['configurations']
