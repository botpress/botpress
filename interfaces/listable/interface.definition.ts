/* bplint-disable */
import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string() })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)
const nextToken = z.string().optional()

export default new InterfaceDefinition({
  name: 'listable',
  version: '0.0.1',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {},
  actions: {
    list: {
      input: {
        schema: () => z.object({ nextToken }),
      },
      output: {
        schema: (args) =>
          z.object({
            items: z.array(withId(args.item)),
            meta: z.object({ nextToken }),
          }),
      },
    },
  },
})
