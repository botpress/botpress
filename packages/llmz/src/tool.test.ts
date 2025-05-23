import { describe, it, expect } from 'vitest'
import { z } from '@bpinternal/zui'

import { Tool } from './tool.js'

describe('tools typings', () => {
  it('simple tool with no description', async () => {
    const tool = new Tool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number(),
      }),
      output: z.number(),
      handler: async ({ a, b }) => {
        return a + b
      },
    })

    const typings = await tool.getTypings()

    expect(typings).toMatchInlineSnapshot(`"declare function add(args: { a: number; b: number }): Promise<number>"`)
  })

  it('input as array of number', async () => {
    const tool = new Tool({
      name: 'add',
      input: z.array(z.number()),
      output: z.array(z.number()),
      handler: async (input) => {
        return input
      },
    })

    const typings = await tool.getTypings()

    expect(typings).toMatchInlineSnapshot(`"declare function add(args: number[]): Promise<number[]>"`)
  })

  it('no args, no output', async () => {
    const tool = new Tool({
      name: 'noArgsNoOutput',
      handler: async () => {
        return
      },
    })

    const typings = await tool.getTypings()

    expect(typings).toMatchInlineSnapshot(`"declare function noArgsNoOutput(): Promise<void>"`)
  })

  it('tool description gets added', async () => {
    const tool = new Tool({
      name: 'noArgsNoOutput',
      description: 'This is a test description\nThis is a second line',
      handler: async () => {
        return
      },
    })

    const typings = await tool.getTypings()

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is a test description
       * This is a second line
       */
      declare function noArgsNoOutput(): Promise<void>"
    `)
  })

  it('tool with union as params', async () => {
    const tool = new Tool({
      name: 'noArgsNoOutput',
      description: 'This is a test description\nThis is a second line',
      input: z.union([z.object({ a: z.number() }), z.object({ b: z.string() })]),
      handler: async () => {
        return
      },
    })

    const typings = await tool.getTypings()

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is a test description
       * This is a second line
       */
      declare function noArgsNoOutput(
        args: { a: number } | { b: string },
      ): Promise<void>"
    `)
  })
})

describe('tools with unique names', () => {
  it('no duplicate names', () => {
    const tools = Tool.withUniqueNames([
      new Tool({ name: 'add', handler: async () => {} }),
      new Tool({ name: 'add', handler: async () => {} }),
      new Tool({ name: 'sub', handler: async () => {} }),
      new Tool({ name: 'add', handler: async () => {} }),
      new Tool({ name: 'sub', handler: async () => {} }),
      new Tool({ name: 'unique', handler: async () => {} }),
    ])

    expect(tools.map((t) => t.name)).toMatchInlineSnapshot(`
      [
        "add1",
        "add1",
        "sub1",
        "add",
        "sub",
        "unique",
      ]
    `)
  })
})

describe('tool default values', () => {
  it('no default value override', async () => {
    let result = -1
    const tool = new Tool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number(),
      }),
      handler: async ({ a, b }) => {
        result = a + b
      },
    })

    tool.execute({ a: 1, b: 2 })

    expect(result).toBe(3)
  })

  it('tool execution fails if input schema fails validation', async () => {
    let result = -1
    const tool = new Tool({
      name: 'add',
      input: z.object({
        a: z.number().min(2), // a must be greater than 2
        b: z.number(),
      }),
      handler: async ({ a, b }) => {
        result = a + b
      },
    })

    await expect(tool.execute({ a: 1, b: 2 })).rejects.toThrowErrorMatchingInlineSnapshot(`
      [Error: Tool "add" received invalid input: [
        {
          "code": "too_small",
          "minimum": 2,
          "type": "number",
          "inclusive": true,
          "exact": false,
          "message": "Number must be greater than or equal to 2",
          "path": [
            "a"
          ]
        }
      ]]
    `)

    expect(result).toBe(-1)
  })

  it('tool execution does not fail if output schema fails validation', async () => {
    let result = -1
    const tool = new Tool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number(),
      }),
      output: z.number().min(5), // output must be greater than 5
      handler: async ({ a, b }) => {
        result = a + b
        return result
      },
    })

    const output = await tool.execute({ a: 1, b: 2 })

    expect(result).toBe(3)
    expect(output).toBe(3)
  })

  it('tool execution swaps input with default values', async () => {
    let result = -1

    const tool = new Tool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number(),
      }),
      output: z.number(),
      staticInputValues: {
        a: 10,
      },
      handler: async ({ a, b }) => {
        result = a + b
        return result
      },
    })

    const ret = await tool.execute({
      a: 1, // a will be hot swapped with 10
      b: 2, // b remains 2
    })

    expect(result).toBe(12)
    expect(ret).toBe(12)
  })

  it('tool execution swaps input with default values (deeply nested)', async () => {
    let callInputs: any = null
    const tool = new Tool({
      name: 'compute',
      input: z
        .object({
          operation: z.literal('add').or(z.literal('subtract')),
          strings: z.array(z.string()).default([]),
          options: z.object({
            strings: z.array(z.string()).default([]),
            name: z.enum(['foo', 'bar']).optional(),
            enabled: z.boolean().optional().default(false),
            numbers: z.array(z.number()).default([]),
          }),
        })
        .describe('Compute the sum or difference of numbers'),
      output: z.number(),
      staticInputValues: {
        operation: 'add',
        strings: ['charles', 'sells', 'chickens'],
        options: {
          strings: ['another', 'tupple'],
          name: 'foo',
          enabled: true,
          numbers: [10, 20, 30],
        },
      }, // TODO: this has to be implemented elsewhere
      handler: async (input) => {
        callInputs = input
        const { operation, options } = input
        if (operation === 'add') {
          return options.numbers?.reduce((acc, n) => acc + n, 0)
        } else {
          return options.numbers?.reduce((acc, n) => acc - n, 0)
        }
      },
    })

    expect(
      await tool.execute({
        operation: 'subtract', // operation will be hot swapped with 'add'
        strings: [],
        options: {
          numbers: [1, 2, 3],
          enabled: false,
          strings: [],
        },
      })
    ).toBe(60)

    expect(callInputs).toMatchInlineSnapshot(`
      {
        "operation": "add",
        "options": {
          "enabled": true,
          "name": "foo",
          "numbers": [
            10,
            20,
            30,
          ],
          "strings": [
            "another",
            "tupple",
          ],
        },
        "strings": [
          "charles",
          "sells",
          "chickens",
        ],
      }
    `)
  })

  it('tools input schemas', async () => {
    const anySchema = new Tool({
      name: 'anySchema',
      input: z.any(),
      handler: async () => {},
    })

    const unknownSchema = new Tool({
      name: 'unknownSchema',
      input: z.unknown(),
      handler: async () => {},
    })

    const enumSchema = new Tool({
      name: 'enumSchema',
      input: z.enum(['a', 'b', 'c']),
      handler: async () => {},
    })

    const neverSchema = new Tool({
      name: 'neverSchema',
      input: z.never(),
      handler: async () => {},
    })

    const defaultValueSchema = new Tool({
      name: 'defaultValueSchema',
      input: z
        .object({
          a: z.number().default(1),
          b: z.string().default('hello'),
        })
        .nullable()
        .default({ a: 1, b: 'hello' }),
      handler: async () => {},
    })

    expect(await anySchema.clone().getTypings()).toMatchInlineSnapshot(
      `"declare function anySchema(any): Promise<void>"`
    )
    expect(await unknownSchema.clone().getTypings()).toMatchInlineSnapshot(
      `"declare function unknownSchema(any): Promise<void>"`
    )
    expect(await enumSchema.clone().getTypings()).toMatchInlineSnapshot(`
      "declare function enumSchema
      ('a' | 'b' | 'c'): Promise<void>;"
    `)
    expect(await neverSchema.clone().getTypings()).toMatchInlineSnapshot(
      `"declare function neverSchema(any): Promise<void>"`
    )
    expect(await defaultValueSchema.clone().getTypings()).toMatchInlineSnapshot(`
      "declare function defaultValueSchema
      ({ a: number; b: string } | null): Promise<void>;"
    `)
  })
})
