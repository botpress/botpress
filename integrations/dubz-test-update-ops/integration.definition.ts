import { z, IntegrationDefinition } from '@botpress/sdk'
import { integrationName } from './package.json'

export default new IntegrationDefinition({
  name: integrationName,
  version: '0.1.0',
  configuration: {
    schema: z.object({}),
  },
  channels: {
    webhook: {
      conversation: {
        tags: {
          id: { title: 'Conversation ID', description: 'The ID of the conversation' },
        },
      },
      messages: {
        text: {
          schema: z.object({
            text: z.string(),
          }),
        },
      },
    },
  },
  user: {
    tags: {
      id: { title: 'User ID', description: 'The ID of the user' },
    },
  },
  // extraOperations intentionally omitted: this integration uses workspace:* @botpress/sdk (currently 7.1.0),
  // meeting bridge's MESSAGE_AND_CONVERSATION_UPDATED_SDK_VERSION_THRESHOLD - testing that the version-gate
  // alone is sufficient, without the flag, against local bridge.
})
