import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'conversation-started',
  version: '0.0.1',
  entities: {},
  events: {
    conversationStarted: {
      schema: () =>
        z.object({
          userId: z.string().title('User ID').describe('The Botpress ID of the user who started the conversation'),
          conversationId: z.string().title('Conversation ID').describe('The Botpress ID of the conversation'),
        }),
    },
  },
  actions: {},
})
