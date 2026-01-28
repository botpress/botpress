import { z, InterfaceDefinition } from '@botpress/sdk'

const baseItem = z.object({ id: z.string().title('Item ID').describe('The unique identifier for the listable item') })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)
const nextToken = z.string().optional()

export default new InterfaceDefinition({
  name: 'listable',
  version: '0.0.3',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {},
  actions: {
    list: {
      input: {
        schema: () =>
          z.object({
            nextToken: nextToken
              .title('List Token')
              .describe('The token to get a given list of items (e.g. a parent record ID, or a page index).'),
          }),
      },
      output: {
        schema: (args) =>
          z.object({
            items: z.array(withId(args.item)),
            meta: z
              .object({
                nextToken: nextToken
                  .title('List Token')
                  .describe('The token to get a given list of items (e.g. a parent record ID, or a page index).'),
              })
              .title('Metadata')
              .describe('Metadata for the list operation'),
          }),
      },
    },
  },
  __advanced: {
    useLegacyZuiTransformer: true,
  },
})
