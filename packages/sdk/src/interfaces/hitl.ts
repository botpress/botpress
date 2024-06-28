import { InterfaceDeclaration } from '../integration/definition'
import { z } from '../zui'

export const hitl = new InterfaceDeclaration({
  name: 'hitl',
  version: '0.0.1',
  entities: {},
  events: {},
  actions: {
    startHITL: {
      input: {
        schema: () => z.object({ upstreamConversationId: z.string() }),
      },
      output: {
        schema: () => z.object({ downstreamConversationId: z.string() }),
      },
    },
  },
})
