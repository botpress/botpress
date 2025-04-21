import * as sdk from '@botpress/sdk'
import threadedResponses from './bp_modules/threaded-responses'

export default new sdk.PluginDefinition({
  name: 'reply-as-thread',
  version: '0.1.0',
  title: 'Reply as Thread',
  description: 'Reply to messages in a thread in integrations that support it',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration: {
    schema: sdk.z.object({}),
  },
  actions: {},
  states: {},
  user: {
    tags: {},
  },
  conversation: {
    tags: {},
  },
  interfaces: {
    'threaded-responses': threadedResponses,
  },
  events: {},
})
