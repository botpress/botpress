import { describe, it, expect } from 'vitest'
import { z } from '@bpinternal/zui'

import { llmz } from './llmz.js'
import { getToolTypings, getToolsWithUniqueNames } from './tools.js'

describe('tools typings', () => {
  it('simple tool with no description', async () => {
    const tool = llmz.makeTool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number()
      }),
      output: z.number(),
      fn: ({ a, b }) => {
        return a + b
      }
    })

    const typings = await getToolTypings(tool)

    expect(typings).toMatchInlineSnapshot('"declare function add(args: { a: number; b: number }): number"')
  })

  it('input as array of number', async () => {
    const tool = llmz.makeTool({
      name: 'add',
      input: z.array(z.number()),
      output: z.promise(z.array(z.number())),
      fn: async (input) => {
        return input
      }
    })

    const typings = await getToolTypings(tool)

    expect(typings).toMatchInlineSnapshot('"declare function add(args: number[]): Promise<number[]>"')
  })

  it('no args, no output', async () => {
    const tool = llmz.makeTool({
      name: 'noArgsNoOutput',
      fn: () => {
        return
      }
    })

    const typings = await getToolTypings(tool)

    expect(typings).toMatchInlineSnapshot('"declare function noArgsNoOutput(): void"')
  })

  it('tool description gets added', async () => {
    const tool = llmz.makeTool({
      name: 'noArgsNoOutput',
      description: 'This is a test description\nThis is a second line',
      fn: () => {
        return
      }
    })

    const typings = await getToolTypings(tool)

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is a test description
       * This is a second line
       */
      declare function noArgsNoOutput(): void"
    `)
  })

  it('tool with union as params', async () => {
    const tool = llmz.makeTool({
      name: 'noArgsNoOutput',
      description: 'This is a test description\nThis is a second line',
      input: z.union([z.object({ a: z.number() }), z.object({ b: z.string() })]),
      fn: () => {
        return
      }
    })

    const typings = await getToolTypings(tool)

    expect(typings).toMatchInlineSnapshot(`
      "/**
       * This is a test description
       * This is a second line
       */
      declare function noArgsNoOutput(args: { a: number } | { b: string }): void"
    `)
  })
})

describe('tools with unique names', () => {
  it('no duplicate names', () => {
    const tools = getToolsWithUniqueNames([
      llmz.makeTool({ name: 'add', fn: () => {} }),
      llmz.makeTool({ name: 'add', fn: () => {} }),
      llmz.makeTool({ name: 'sub', fn: () => {} }),
      llmz.makeTool({ name: 'add', fn: () => {} }),
      llmz.makeTool({ name: 'sub', fn: () => {} }),
      llmz.makeTool({ name: 'unique', fn: () => {} })
    ])
    expect(tools.map((t) => t.name)).toMatchInlineSnapshot(`
      [
        "add1",
        "add2",
        "sub1",
        "add3",
        "sub2",
        "unique",
      ]
    `)
  })
})

describe('tool default values', () => {
  it('no default value override', async () => {
    let result = -1
    const tool = llmz.makeTool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number()
      }),
      fn: ({ a, b }) => {
        result = a + b
      }
    })

    tool.fn({ a: 1, b: 2 }, {} as any)
    expect(result).toBe(3)
  })

  it('tool execution fails if input schema fails validation', async () => {
    let result = -1
    const tool = llmz.makeTool({
      name: 'add',
      input: z.object({
        a: z.number().min(2), // a must be greater than 2
        b: z.number()
      }),
      fn: ({ a, b }) => {
        result = a + b
      }
    })

    expect(() => tool.fn({ a: 1, b: 2 }, {} as any)).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
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
    const tool = llmz.makeTool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number()
      }),
      output: z.number().min(5), // output must be greater than 5
      fn: ({ a, b }) => {
        result = a + b
        return result
      }
    })

    const output = tool.fn({ a: 1, b: 2 }, {} as any)
    expect(result).toBe(3)
    expect(output).toBe(3)
  })

  it('tool execution swaps input with default values', async () => {
    let result = -1
    const tool = llmz.makeTool({
      name: 'add',
      input: z.object({
        a: z.number(),
        b: z.number()
      }),
      defaultInputValues: {
        a: 10
      },
      fn: ({ a, b }) => {
        result = a + b
      }
    })

    tool.fn(
      {
        a: 1, // a will be hot swapped with 10
        b: 2 // b remains 2
      },
      {} as any
    )
    expect(result).toBe(12)
  })

  it('tool execution swaps input with default values (deeply nested)', async () => {
    let callInputs: any = null
    const tool = llmz.makeTool({
      name: 'compute',
      input: z
        .object({
          operation: z.literal('add').or(z.literal('subtract')),
          strings: z.array(z.string()).default([]),
          options: z.object({
            strings: z.array(z.string()).default([]),
            name: z.enum(['foo', 'bar']).optional(),
            enabled: z.boolean().optional().default(false),
            numbers: z.array(z.number()).default([])
          })
        })
        .describe('Compute the sum or difference of numbers'),
      defaultInputValues: {
        operation: 'add',
        strings: ['charles', 'sells', 'chickens'],
        options: {
          strings: ['another', 'tupple'],
          name: 'foo',
          enabled: true,
          numbers: [10, 20, 30]
        }
      },
      fn: (input) => {
        callInputs = input
        const { operation, options } = input
        // console.log('operation', options)
        if (operation === 'add') {
          return options.numbers.reduce((acc, n) => acc + n, 0)
        } else {
          return options.numbers.reduce((acc, n) => acc - n, 0)
        }
      }
    })

    expect(
      tool.fn(
        {
          operation: 'subtract', // operation will be hot swapped with 'add'
          strings: [],
          options: {
            numbers: [1, 2, 3],
            enabled: false,
            strings: []
          }
        },
        {} as any
      )
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
})
