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
            messageId: z.string().describe('The message ID to which the typing indicator should be attached'),
            timeout: z
              .number()
              .optional()
              .describe('The timeout in milliseconds after which the typing indicator should stop'),
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
            messageId: z.string().describe('The message ID from which the typing indicator should be removed'),
          }),
      },
      output: {
        schema: () => z.object({}),
      },
    },
  },
})
