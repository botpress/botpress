import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string().title('Item ID').describe('The unique identifier for the updatable item') })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)

export default new InterfaceDefinition({
  name: 'updatable',
  version: '0.0.3',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {
    updated: {
      schema: (args) =>
        z.object({
          item: withId(args.item),
        }),
    },
  },
  actions: {
    update: {
      input: {
        schema: (args) => baseItem.extend({ item: args.item }),
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
