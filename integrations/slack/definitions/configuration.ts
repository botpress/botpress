import * as sdk from '@botpress/sdk'

export const channelOriginSchema = sdk.z
  .enum(['dm', 'channel', 'thread'])
  .default('channel')
  .title('Channel Origin')
  .describe('The origin of the conversation (channel, dm, or thread)')
export const replyLocationSchema = sdk.z
  .enum(['channel', 'thread', 'channelAndThread'])
  .default('channel')
  .title('Reply Location')
  .describe('The location where the bot will reply to the message (channel, thread, or channelAndThread)')
export const channelMentionSchema = sdk.z
  .enum(['required', 'notRequired'])
  .default('notRequired')
  .title('Channel Mention')
  .describe('Whether the bot requires an @mention to reply in channels')
export const threadMentionSchema = sdk.z
  .enum(['required', 'inherit', 'notRequired'])
  .default('notRequired')
  .title('Thread Mention')
  .describe(
    'Whether the bot requires an @mention to reply in threads: required, inherit (reply if bot was mentioned in parent), or notRequired'
  )

export type ChannelOrigin = sdk.z.infer<typeof channelOriginSchema>
export type ReplyLocation = sdk.z.infer<typeof replyLocationSchema>
export type ChannelMention = sdk.z.infer<typeof channelMentionSchema>
export type ThreadMention = sdk.z.infer<typeof threadMentionSchema>

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
      location: replyLocationSchema,
      channelMention: channelMentionSchema,
      threadMention: threadMentionSchema,
    })
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
    schema: sdk.z.object({
      refreshToken: sdk.z
        .string()
        .secret()
        .title('Slack Refresh Token or Bot Token')
        .describe('Available in the app admin panel under OAuth & Permissions'),
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
