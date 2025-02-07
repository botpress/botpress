import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'proactiveConversation',
  version: '0.0.2',
  entities: {
    conversation: {
      title: 'Conversation',
      description: 'The conversation object fields',
      schema: z.object({}).title('Conversation').describe('The conversation object fields'),
    },
  },
  actions: {
    getOrCreateConversation: {
      input: {
        schema: ({ conversation }) =>
          z.object({
            conversation: conversation.title('Conversation').describe('The conversation object fields'),
          }),
      },
      output: {
        schema: () =>
          z.object({
            conversationId: z.string().title('Conversation ID').describe('The Botpress ID of the created conversation'),
          }),
      },
    },
  },
})
