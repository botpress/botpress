import { z, InterfaceDeclaration } from '@botpress/sdk'

const baseItem = z.object({ id: z.string() })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)
const templateName = '{{camelCase item}}{{pascalCase name}}'

export default new InterfaceDeclaration({
  name: 'updatable',
  version: '0.0.1',
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
  templateName,
})
