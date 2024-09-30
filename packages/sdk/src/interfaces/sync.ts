import { InterfaceDeclaration } from '../integration/definition'
import z from '../zui'

const baseItem = z.object({ id: z.string() })
const withId = (schema: z.ZodTypeAny) => z.intersection(schema, baseItem)

const templateName = '{{camelCase item}}{{pascalCase name}}'

const nextToken = z.string().optional()
export const listable = new InterfaceDeclaration({
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
  templateName,
})

export const creatable = new InterfaceDeclaration({
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

export const readable = new InterfaceDeclaration({
  name: 'readable',
  version: '0.0.1',
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
  templateName,
})

export const updatable = new InterfaceDeclaration({
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

export const deletable = new InterfaceDeclaration({
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
  templateName,
})
