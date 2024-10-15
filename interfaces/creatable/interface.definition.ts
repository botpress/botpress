import { z, InterfaceDeclaration } from '@botpress/sdk'

const baseItem = z.object({ id: z.string() })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)
const templateName = '{{camelCase item}}{{pascalCase name}}'

export default new InterfaceDeclaration({
  name: 'creatable',
  version: '0.0.1',
  entities: {
    item: {
      schema: baseItem,
    },
  },
  events: {
    created: {
      schema: (args) =>
        z.object({
          item: withId(args.item),
        }),
    },
  },
  actions: {
    create: {
      input: {
        schema: (args) => z.object({ item: args.item }),
      },
      output: {
        schema: (args) => z.object({ item: withId(args.item) }),
      },
    },
  },
  templateName,
})
