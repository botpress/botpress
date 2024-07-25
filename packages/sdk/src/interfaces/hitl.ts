import { InterfaceDeclaration } from '../integration/definition'
import * as messages from '../message'
import { z } from '../zui'

export const hitl = new InterfaceDeclaration({
  name: 'hitl',
  version: '0.1.0',
  entities: {},
  events: {
    ticketAssigned: {
      schema: () =>
        z.object({
          conversationId: z.string(),
          userId: z.string(),
        }),
    },
    ticketClosed: {
      schema: () =>
        z.object({
          conversationId: z.string(),
        }),
    },
  },
  actions: {
    createUser: {
      input: {
        schema: () =>
          z.object({
            name: z.string().optional(),
            pictureUrl: z.string().optional(),
            email: z.string().optional(),
          }),
      },
      output: {
        schema: () =>
          z.object({
            userId: z.string(),
          }),
      },
    },
    openTicket: {
      input: {
        schema: () =>
          z.object({
            userId: z.string(),
            title: z.string(),
            description: z.string().optional(),
          }),
      },
      output: {
        schema: () =>
          z.object({
            conversationId: z.string(),
          }),
      },
    },
    closeTicket: {
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
  channels: {
    ticket: {
      messages: {
        text: {
          schema: () =>
            messages.defaults.text.schema.extend({
              userId: z.string().optional().describe('Allows sending a message pretending to be a certain user'),
            }),
        },
      },
    },
  },
})
