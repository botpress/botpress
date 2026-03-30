import { IntegrationDefinition, z } from '@botpress/sdk'
import proactiveConversation from 'bp_modules/proactive-conversation'
import typingIndicator from 'bp_modules/typing-indicator'

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

// TODO: use default options
const toJSONSchemaOptions: Partial<z.transforms.JSONSchemaGenerationOptions> = {
  discriminatedUnionStrategy: 'anyOf',
  discriminator: false,
}

export default new IntegrationDefinition({
  name: 'slack',
  title: 'Slack',
  description: 'Automate interactions with your team.',
  version: '4.1.0',
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
  entities: {
    conversation: {
      title: 'Conversation',
      description: 'A Slack channel conversation',
      schema: z.object({
        channelId: z
          .string()
          .optional()
          .title('Channel ID')
          .describe('The Slack channel ID. If provided, the channel name lookup is skipped.'),
        channelName: z
          .string()
          .optional()
          .title('Channel Name')
          .describe('The name of the channel. Used to look up the channel if no ID is provided.'),
      }),
    },
  },
  attributes: {
    category: 'Communication & Channels',
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
      getOrCreateConversation: { name: 'startChannelConversation' },
    },
  }))
