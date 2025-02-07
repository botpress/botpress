/* bplint-disable */
import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string() })

export default new InterfaceDefinition({
  name: 'deletable',
  version: '0.0.1',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {
    deleted: {
      schema: () => baseItem,
    },
  },
  actions: {
    delete: {
      input: {
        schema: () => baseItem,
      },
      output: {
        schema: () => z.object({}),
      },
    },
  },
})
