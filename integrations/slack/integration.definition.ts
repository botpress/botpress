import { IntegrationDefinition, z } from '@botpress/sdk'
import proactiveConversation from 'bp_modules/proactive-conversation'
import typingIndicator from 'bp_modules/typing-indicator'

import { actions, channels, events, secrets, states, user } from './definitions'

// TODO: use default options
const toJSONSchemaOptions: Partial<z.transforms.JSONSchemaGenerationOptions> = {
  discriminatedUnionStrategy: 'anyOf',
  discriminator: false,
}

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '5.0.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
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
  },
  identifier: {
    extractScript: 'extract.vrl',
    fallbackHandlerScript: 'fallbackHandler.vrl',
  },
  states,
  channels,
  actions,
  events,
  secrets,
  user,
  entities: {
    conversation: {
      title: 'Conversation',
      description: 'A Slack conversation (channel or DM)',
      schema: z.object({
        channelId: z
          .string()
          .optional()
          .title('Channel ID')
          .describe('The Slack channel ID. If provided, the channel name lookup is skipped. (for channel type)'),
      }),
    },
  },
  attributes: {
    category: 'Communication & Channels',
    guideSlug: 'slack',
    repo: 'botpress',
  },
  __advanced: {
    toJSONSchemaOptions,
  },
})
  .extend(typingIndicator, () => ({
    entities: {},
  }))
  .extend(proactiveConversation, ({ entities }) => ({
    entities: {
      conversation: entities.conversation,
    },
    actions: {
      getOrCreateConversation: { name: 'getOrCreateChannelConversation' },
    },
  }))
