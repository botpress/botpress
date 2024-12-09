import { z, InterfaceDefinition } from '@botpress/sdk'

export default new InterfaceDefinition({
  name: 'proactiveConversation',
  version: '0.0.1',
  actions: {
    createConversation: {
      input: {
        schema: () =>
          z.object({
            tags: z
              .record(z.string())
              .optional()
              .title('Tags')
              .describe('The tags to set the conversation when creating'),
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
