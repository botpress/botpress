import { IntegrationDefinition } from '@botpress/sdk'
import typingIndicator from 'bp_modules/typing-indicator'
import threadedResponses from './bp_modules/threaded-responses'

import {
  actions,
  channels,
  configuration,
  configurations,
  events,
  identifier,
  secrets,
  states,
  user,
} from './definitions'

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '2.1.0',
  icon: 'icon.svg',
  readme: 'hub.md',
  configuration,
  configurations,
  identifier,
  states,
  channels,
  actions,
  events,
  secrets,
  user,
})
  .extend(typingIndicator, () => ({
    entities: {},
  }))
  .extend(threadedResponses, () => ({
    entities: {},
    channels: {
      groupChat: {
        name: 'channel',
        ...channels.channel,
      },
      groupChatThread: {
        name: 'thread',
        ...channels.thread,
      },
    },
    actions: {
      createReplyThread: {
        name: 'createReplyThread',
        title: 'Create a reply thread',
        description: 'Create a reply thread for a channel message',
      },
    },
  }))
