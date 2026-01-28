import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string().title('Item ID').describe('The unique identifier for the deletable item') })

export default new InterfaceDefinition({
  name: 'deletable',
  version: '0.0.3',
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
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
