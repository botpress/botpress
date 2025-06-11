import { describe, test, expect } from 'vitest'
import Ajv from 'ajv'
import { z } from '../../../z/index'
import { zodToJsonSchema } from '../zodToJsonSchema'
const ajv = new Ajv()
import deref from 'local-ref-resolver'
import { zuiKey } from '../../../ui/constants'

describe('Pathing', () => {
  test('should handle recurring properties with paths', () => {
    const addressSchema = z.object({
      street: z.string(),
      number: z.number(),
      city: z.string(),
    })
    const someAddresses = z.object({
      address1: addressSchema,
      address2: addressSchema,
      lotsOfAddresses: z.array(addressSchema),
    })
    const jsonSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        address1: {
          type: 'object',
          properties: {
            street: { type: 'string', [zuiKey]: {} },
            number: { type: 'number', [zuiKey]: {} },
            city: { type: 'string', [zuiKey]: {} },
          },
          additionalProperties: false,
          required: ['street', 'number', 'city'],
          [zuiKey]: {},
        },
        address2: { $ref: '#/properties/address1' },
        lotsOfAddresses: {
          type: 'array',
          items: { $ref: '#/properties/address1' },
          [zuiKey]: {},
        },
      },
      additionalProperties: false,
      required: ['address1', 'address2', 'lotsOfAddresses'],
      [zuiKey]: {},
    }

    const parsedSchema = zodToJsonSchema(someAddresses)
    expect(parsedSchema).toEqual(jsonSchema)
    expect(ajv.validateSchema(parsedSchema)).toBe(true)
  })

  test('Should properly reference union participants', () => {
    const participant = z.object({ str: z.string() })

    const schema = z.object({
      union: z.union([participant, z.string()]),
      part: participant,
    })

    const expectedJsonSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        union: {
          anyOf: [
            {
              type: 'object',
              [zuiKey]: {},
              properties: {
                str: {
                  type: 'string',
                  [zuiKey]: {},
                },
              },
              additionalProperties: false,
              required: ['str'],
            },
            {
              type: 'string',
              [zuiKey]: {},
            },
          ],
          [zuiKey]: {},
        },
        part: {
          $ref: '#/properties/union/anyOf/0',
        },
      },
      additionalProperties: false,
      required: ['union', 'part'],
      [zuiKey]: {},
    }

    const parsedSchema = zodToJsonSchema(schema)

    expect(parsedSchema).toEqual(expectedJsonSchema)
    expect(ajv.validateSchema(parsedSchema)).toBe(true)

    const resolvedSchema = deref(expectedJsonSchema)
    expect(resolvedSchema.properties.part).toEqual(resolvedSchema.properties.union.anyOf[0])
  })

  test('Should be able to handle recursive schemas', () => {
    type Category = {
      name: string
      subcategories: Category[]
    }

    // cast to z.ZodSchema<Category>
    // @ts-ignore
    const categorySchema: z.ZodSchema<Category> = z.lazy(() =>
      z.object({
        name: z.string(),
        subcategories: z.array(categorySchema),
      }),
    )

    const parsedSchema = zodToJsonSchema(categorySchema)

    const expectedJsonSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          [zuiKey]: {},
        },
        subcategories: {
          type: 'array',
          items: {
            $ref: '#',
          },
          [zuiKey]: {},
        },
      },
      required: ['name', 'subcategories'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(expectedJsonSchema)
    expect(ajv.validateSchema(parsedSchema)).toBe(true)

    const resolvedSchema = deref(parsedSchema)
    expect(resolvedSchema.properties.subcategories.items).toEqual(resolvedSchema)
  })

  test('Should be able to handle complex & nested recursive schemas', () => {
    type Category = {
      name: string
      inner: {
        subcategories?: Record<string, Category> | null
      }
    }

    // cast to z.ZodSchema<Category>
    // @ts-ignore
    const categorySchema: z.ZodSchema<Category> = z.lazy(() =>
      z.object({
        name: z.string(),
        inner: z.object({
          subcategories: z.record(categorySchema).nullable().optional(),
        }),
      }),
    )

    const inObjectSchema = z.object({
      category: categorySchema,
    })

    const parsedSchema = zodToJsonSchema(inObjectSchema)

    const expectedJsonSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      additionalProperties: false,
      required: ['category'],
      properties: {
        category: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              [zuiKey]: {},
            },
            inner: {
              type: 'object',
              additionalProperties: false,
              properties: {
                subcategories: {
                  anyOf: [
                    {
                      type: 'object',
                      additionalProperties: {
                        $ref: '#/properties/category',
                      },
                      [zuiKey]: {},
                    },
                    {
                      type: 'null',
                    },
                  ],
                  [zuiKey]: {},
                },
              },
              [zuiKey]: {},
            },
          },
          [zuiKey]: {},
          required: ['name', 'inner'],
          additionalProperties: false,
        },
      },
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(expectedJsonSchema)
    expect(ajv.validateSchema(parsedSchema)).toBe(true)
  })

  test('should work with relative references', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      $refStrategy: 'relative',
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          [zuiKey]: {},
        },
        bar: {
          $ref: '1/foo',
        },
      },
      required: ['foo', 'bar'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should be possible to override the base path', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      basePath: ['#', 'lol', 'xD'],
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          [zuiKey]: {},
        },
        bar: {
          $ref: '#/lol/xD/properties/foo',
        },
      },
      required: ['foo', 'bar'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should be possible to override the base path with name', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      basePath: ['#', 'lol', 'xD'],
      name: 'kex',
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/lol/xD/definitions/kex',
      definitions: {
        kex: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
            bar: {
              $ref: '#/lol/xD/definitions/kex/properties/foo',
            },
          },
          required: ['foo', 'bar'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should be possible to opt out of $ref building', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      $refStrategy: 'none',
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        foo: {
          type: 'string',
          [zuiKey]: {},
        },
        bar: {
          type: 'string',
          [zuiKey]: {},
        },
      },
      required: ['foo', 'bar'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('When opting out of ref building and using recursive schemas, should warn and default to any', () => {
    const was = console.warn
    let warning = ''
    console.warn = (x: any) => (warning = x)

    type Category = {
      name: string
      subcategories: Category[]
    }

    // cast to z.ZodSchema<Category>
    // @ts-ignore
    const categorySchema: z.ZodSchema<Category> = z.lazy(() =>
      z.object({
        name: z.string(),
        subcategories: z.array(categorySchema),
      }),
    )

    const parsedSchema = zodToJsonSchema(categorySchema, {
      $refStrategy: 'none',
    })

    const expectedJsonSchema = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: {
          type: 'string',
          [zuiKey]: {},
        },
        subcategories: {
          type: 'array',
          items: {},
          [zuiKey]: {},
        },
      },
      required: ['name', 'subcategories'],
      additionalProperties: false,
      [zuiKey]: {},
    }

    expect(parsedSchema).toEqual(expectedJsonSchema)
    expect(warning).toBe('Recursive reference detected at #/properties/subcategories/items! Defaulting to any')

    console.warn = was
  })

  test('should be possible to override get proper references even when picking optional definitions path $defs', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      name: 'hello',
      definitionPath: '$defs',
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/$defs/hello',
      $defs: {
        hello: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
            bar: {
              $ref: '#/$defs/hello/properties/foo',
            },
          },
          required: ['foo', 'bar'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should be possible to override get proper references even when picking optional definitions path definitions', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, {
      name: 'hello',
      definitionPath: 'definitions',
    })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/hello',
      definitions: {
        hello: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
            bar: {
              $ref: '#/definitions/hello/properties/foo',
            },
          },
          required: ['foo', 'bar'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should preserve correct $ref when overriding name with string', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, 'hello')

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/hello',
      definitions: {
        hello: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
            bar: {
              $ref: '#/definitions/hello/properties/foo',
            },
          },
          required: ['foo', 'bar'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should preserve correct $ref when overriding name with object property', () => {
    const recurringSchema = z.string()
    const objectSchema = z.object({
      foo: recurringSchema,
      bar: recurringSchema,
    })

    const jsonSchema = zodToJsonSchema(objectSchema, { name: 'hello' })

    const expectedResult = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/hello',
      definitions: {
        hello: {
          type: 'object',
          properties: {
            foo: {
              type: 'string',
              [zuiKey]: {},
            },
            bar: {
              $ref: '#/definitions/hello/properties/foo',
            },
          },
          required: ['foo', 'bar'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    }

    expect(jsonSchema).toEqual(expectedResult)
  })

  test('should be possible to preload a single definition', () => {
    const myRecurringSchema = z.string()
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: myRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema },
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: {
          $ref: '#/definitions/myRecurringSchema',
        },
        b: {
          $ref: '#/definitions/myRecurringSchema',
        },
      },
      additionalProperties: false,
      definitions: {
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
      },
      [zuiKey]: {},
    })
  })

  test('should be possible to preload multiple definitions', () => {
    const myRecurringSchema = z.string()
    const mySecondRecurringSchema = z.object({
      x: myRecurringSchema,
    })
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: mySecondRecurringSchema,
      c: mySecondRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema, mySecondRecurringSchema },
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['a', 'b', 'c'],
      properties: {
        a: {
          $ref: '#/definitions/myRecurringSchema',
        },
        b: {
          $ref: '#/definitions/mySecondRecurringSchema',
        },
        c: {
          $ref: '#/definitions/mySecondRecurringSchema',
        },
      },
      additionalProperties: false,
      definitions: {
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
        mySecondRecurringSchema: {
          type: 'object',
          required: ['x'],
          properties: {
            x: {
              $ref: '#/definitions/myRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      [zuiKey]: {},
    })
  })

  test('should be possible to preload multiple definitions and have a named schema', () => {
    const myRecurringSchema = z.string()
    const mySecondRecurringSchema = z.object({
      x: myRecurringSchema,
    })
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: mySecondRecurringSchema,
      c: mySecondRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema, mySecondRecurringSchema },
      name: 'mySchemaName',
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/definitions/mySchemaName',
      definitions: {
        mySchemaName: {
          type: 'object',
          required: ['a', 'b', 'c'],
          properties: {
            a: {
              $ref: '#/definitions/myRecurringSchema',
            },
            b: {
              $ref: '#/definitions/mySecondRecurringSchema',
            },
            c: {
              $ref: '#/definitions/mySecondRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
        mySecondRecurringSchema: {
          type: 'object',
          required: ['x'],
          properties: {
            x: {
              $ref: '#/definitions/myRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    })
  })

  test('should be possible to preload multiple definitions and have a named schema and set the definitions path', () => {
    const myRecurringSchema = z.string()
    const mySecondRecurringSchema = z.object({
      x: myRecurringSchema,
    })
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: mySecondRecurringSchema,
      c: mySecondRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema, mySecondRecurringSchema },
      name: 'mySchemaName',
      definitionPath: '$defs',
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: '#/$defs/mySchemaName',
      $defs: {
        mySchemaName: {
          type: 'object',
          required: ['a', 'b', 'c'],
          properties: {
            a: {
              $ref: '#/$defs/myRecurringSchema',
            },
            b: {
              $ref: '#/$defs/mySecondRecurringSchema',
            },
            c: {
              $ref: '#/$defs/mySecondRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
        mySecondRecurringSchema: {
          type: 'object',
          required: ['x'],
          properties: {
            x: {
              $ref: '#/$defs/myRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    })
  })

  test('should be possible to preload a single definition with custom basePath', () => {
    const myRecurringSchema = z.string()
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: myRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema },
      basePath: ['hello'],
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      required: ['a', 'b'],
      properties: {
        a: {
          $ref: 'hello/definitions/myRecurringSchema',
        },
        b: {
          $ref: 'hello/definitions/myRecurringSchema',
        },
      },
      additionalProperties: false,
      definitions: {
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
      },
      [zuiKey]: {},
    })
  })

  test('should be possible to preload a single definition with custom basePath and name', () => {
    const myRecurringSchema = z.string()
    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: myRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema },
      basePath: ['hello'],
      name: 'kex',
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: 'hello/definitions/kex',
      definitions: {
        kex: {
          type: 'object',
          required: ['a', 'b'],
          properties: {
            a: {
              $ref: 'hello/definitions/myRecurringSchema',
            },
            b: {
              $ref: 'hello/definitions/myRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
        myRecurringSchema: {
          type: 'string',
          [zuiKey]: {},
        },
      },
    })
  })

  test('should be possible for a preloaded definition to circularly reference itself', () => {
    const myRecurringSchema: any = z.object({
      circular: z.lazy(() => myRecurringSchema),
    })

    const myObjectSchema = z.object({
      a: myRecurringSchema,
      b: myRecurringSchema,
    })

    const myJsonSchema = zodToJsonSchema(myObjectSchema, {
      definitions: { myRecurringSchema },
      basePath: ['hello'],
      name: 'kex',
    })

    expect(myJsonSchema).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      $ref: 'hello/definitions/kex',
      definitions: {
        kex: {
          type: 'object',
          required: ['a', 'b'],
          properties: {
            a: {
              $ref: 'hello/definitions/myRecurringSchema',
            },
            b: {
              $ref: 'hello/definitions/myRecurringSchema',
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
        myRecurringSchema: {
          type: 'object',
          required: ['circular'],
          properties: {
            circular: {
              $ref: 'hello/definitions/myRecurringSchema',
              [zuiKey]: {},
            },
          },
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
    })
  })

  test('should handle the user example', () => {
    interface User {
      id: string
      headUser?: User
    }

    const userSchema: z.ZodType<User> = z.lazy(() =>
      z.object({
        id: z.string(),
        headUser: userSchema.optional(),
      }),
    )

    const schema = z.object({ user: userSchema })

    expect(
      zodToJsonSchema(schema, {
        definitions: { userSchema },
      }),
    ).toEqual({
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        user: {
          $ref: '#/definitions/userSchema',
        },
      },
      required: ['user'],
      additionalProperties: false,
      definitions: {
        userSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              [zuiKey]: {},
            },
            headUser: {
              $ref: '#/definitions/userSchema',
              [zuiKey]: {},
            },
          },
          required: ['id'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      [zuiKey]: {},
    })
  })

  test('should handle mutual recursion', () => {
    const leafSchema = z.object({
      prop: z.string(),
    })

    let nodeChildSchema: z.ZodType

    const nodeSchema = z.object({
      children: z.lazy(() => z.array(nodeChildSchema)),
    })

    nodeChildSchema = z.union([leafSchema, nodeSchema])

    const treeSchema = z.object({
      nodes: nodeSchema,
    })

    expect(
      zodToJsonSchema(treeSchema, {
        name: 'Tree',
        definitions: {
          Leaf: leafSchema,
          NodeChild: nodeChildSchema,
          Node: nodeSchema,
        },
      }),
    ).toEqual({
      $ref: '#/definitions/Tree',
      definitions: {
        Leaf: {
          type: 'object',
          properties: {
            prop: {
              type: 'string',
              [zuiKey]: {},
            },
          },
          required: ['prop'],
          additionalProperties: false,
          [zuiKey]: {},
        },
        Node: {
          type: 'object',
          properties: {
            children: {
              type: 'array',
              items: {
                $ref: '#/definitions/NodeChild',
              },
              [zuiKey]: {},
            },
          },
          required: ['children'],
          additionalProperties: false,
          [zuiKey]: {},
        },
        NodeChild: {
          anyOf: [
            {
              $ref: '#/definitions/Leaf',
            },
            {
              $ref: '#/definitions/Node',
            },
          ],
          [zuiKey]: {},
        },
        Tree: {
          type: 'object',
          properties: {
            nodes: {
              $ref: '#/definitions/Node',
            },
          },
          required: ['nodes'],
          additionalProperties: false,
          [zuiKey]: {},
        },
      },
      $schema: 'http://json-schema.org/draft-07/schema#',
    })
  })

  test('should not fail when definition is lazy', () => {
    const lazyString = z.lazy(() => z.string())

    const lazyObject = z.lazy(() => z.object({ lazyProp: lazyString }))

    const jsonSchema = zodToJsonSchema(lazyObject, {
      definitions: { lazyString },
    })

    const expected = {
      type: 'object',
      properties: { lazyProp: { $ref: '#/definitions/lazyString' } },
      required: ['lazyProp'],
      additionalProperties: false,
      definitions: { lazyString: { type: 'string', [zuiKey]: {} } },
      $schema: 'http://json-schema.org/draft-07/schema#',
      [zuiKey]: {},
    }

    expect(jsonSchema).toEqual(expected)
  })
})
