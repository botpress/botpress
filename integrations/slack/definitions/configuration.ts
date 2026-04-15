import { z, IntegrationDefinitionProps } from '@botpress/sdk'

const SHARED_DEFINITION = {
  identifier: {
    linkTemplateScript: 'linkTemplate.vrl',
  },
  schema: z.object({
    botAvatarUrl: z
      .string()
      // .url() // Uncomment this once either the studio bug of not allowing empty strings is fixed, or the ".or()" in zui/studio is supported.
      .optional()
      .title('Bot avatar URL')
      .describe("URL for the image used as the Slack bot's avatar"),
    botName: z.string().optional().title('Bot name').describe('Name displayed as the sender in Slack conversations'),
    typingIndicatorEmoji: z
      .boolean()
      .default(false)
      .title('Typing Indicator Emoji')
      .describe('Temporarily add an emoji to received messages to indicate when bot is processing message'),
    replyBehaviour: z
      .object({
        location: z
          .enum(['channel', 'thread', 'channelAndThread'])
          .default('channel')
          .title('Reply Location')
          .describe('Where the bot sends replies: Channel only, Thread only (creates if needed), or both'),
        onlyOnBotMention: z
          .boolean()
          .default(false)
          .title('Require Bot Mention for Replies')
          .describe('This ensures that the bot only replies to messages when it is explicitly mentioned'),
      })
      .optional()
      .title('Reply Behaviour')
      .describe('How the bot should reply to messages'),
  }),
} as const

export const configuration = {
  ...SHARED_DEFINITION,
} as const satisfies IntegrationDefinitionProps['configuration']

export const configurations = {
  refreshToken: {
    ...SHARED_DEFINITION,
    title: 'Manual configuration',
    description: 'Configure by manually supplying the refresh token and signing secret',
  },
  manifestAppCredentials: {
    ...SHARED_DEFINITION,
    title: 'App Manifest (Automatic Setup)',
    description: 'Register new Slack application',
  },
} as const satisfies IntegrationDefinitionProps['configurations']

export const identifier = {
  extractScript: 'extract.vrl',
  fallbackHandlerScript: 'fallbackHandler.vrl',
} as const satisfies IntegrationDefinitionProps['identifier']
