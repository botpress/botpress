import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string().title('Item ID').describe('The unique identifier for the readable item') })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)

export default new InterfaceDefinition({
  name: 'readable',
  version: '0.0.3',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {},
  actions: {
    read: {
      input: {
        schema: () => baseItem,
      },
      output: {
        schema: (args) => z.object({ item: withId(args.item) }),
      },
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
