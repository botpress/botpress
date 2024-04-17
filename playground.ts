import { z, BaseType } from './src'

type ComponentDefinitions = {
  [T in BaseType]: {
    [K: string]: {
      id: typeof K
      params: z.ZodObject<any>
    }
  }
}

const defs = {
  string: {
    name: {
      id: 'name',
      params: z.object({ name: z.string() }),
    },
    ssn: {
      id: 'ssn',
      params: z.object({ ssn: z.string() }),
    },
  },
  number: {
    age: {
      id: 'age',
      params: z.object({ age: z.number() }),
    },
  },
  array: {},
  boolean: {},
  object: {},
} as const satisfies ComponentDefinitions

z.string().displayAs<typeof defs>({ id: 'ssn', params: { ssn: '123-45-6789' } })

// //  [type][id] from defs, then get the z.infered params
// type ParseSchema<I> = I extends infer U
//   ? U extends { id: string; params: z.ZodObject<any> }
//     ? {
//         id: U['id']
//         params: z.infer<U['params']>
//       }
//     : object
//   : never

// type Opts<T extends BaseType, Defs extends ComponentDefinitions> = Defs[T][keyof Defs[T]]

// function displayAs<T extends BaseType, Defs extends ComponentDefinitions>(opts: ParseSchema<Opts<T, Defs>>) {
//   return opts
// }

// displayAs<'string', typeof defs>({ id: 'name', params: { name: 'John' } })
