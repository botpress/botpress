import * as sdk from '@botpress/sdk'
import slack from './bp_modules/slack'

export default new sdk.PluginDefinition({
  name: 'slack-reply-as-thread',
  version: '0.1.0',
  title: 'Reply as Thread',
  description: 'Reply to slack messages in a thread instead of in the channel',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({
      enableThreading: sdk.z
        .boolean()
        .title('Enable Threading')
        .describe('Whether to enable threading for Slack bot replies')
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
