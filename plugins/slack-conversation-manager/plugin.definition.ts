import * as sdk from '@botpress/sdk'
import slack from './bp_modules/slack'

export default new sdk.PluginDefinition({
  name: 'slack-conversation-manager',
  version: '0.1.0',
  title: 'Slack Conversation Manager',
  description: 'Tweak the way your bot interacts with Slack conversations',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      enableThreading: sdk.z
        .boolean()
        .title('Enable Reply Threading')
        .describe(
          'Whether to enable threading for Slack bot replies. When enabled, the bot replies in a thread instead of in the main channel'
        )
        .default(true),
      ignoreMessagesWithoutMention: sdk.z
        .boolean()
        .title('Ignore Messages Without Mention?')
        .describe('Whether to ignore messages that do not mention the bot directly')
        .default(true),
    }),
  },
  actions: {},
  states: {},
  user: {
    tags: {},
  },
  conversation: {
    tags: {},
  },
  integrations: {
    slack,
  },
  events: {},
})
