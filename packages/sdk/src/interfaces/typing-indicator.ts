import { InterfaceDeclaration } from '../integration'
import z from '../zui'

export const typingIndicator = new InterfaceDeclaration({
  name: 'typingIndicator',
  version: '0.0.1',
  entities: {},
  events: {},
  actions: {
    startTypingIndicator: {
      input: {
        schema: () =>
          z.object({
            conversationId: z.string(),
            timeout: z.number().optional(),
          }),
      },
      output: {
        schema: () => z.object({}),
      },
    },
    stopTypingIndicator: {
      input: {
        schema: () =>
          z.object({
            conversationId: z.string(),
          }),
      },
      output: {
        schema: () => z.object({}),
      },
    },
  },
})
