import { z } from '@bpinternal/zui'

import { assert, describe, expect, it, vi } from 'vitest'
import { llmz } from './llmz.js'
import { makeTool } from './tools.js'
import { check, extract } from '@botpress/vai'
import { ExecutionResult, Traces } from './types.js'
import { createClient } from './client.js'
import { getCachedClient } from './__tests__/index.js'

const cognitive = createClient(getCachedClient())

const assertStatus = (result: ExecutionResult, status: ExecutionResult['status']) => {
  const error = result.status === 'error' ? result.error : null

  if (result.status === 'error' && status !== 'error') {
    throw new Error(`Expected status to be "${status}" but got error: ${error}`)
  }

  expect(result.status).toBe(status)
}

const exec = (result: ExecutionResult) => {
  const removeTraceTimestamps = (trace: Traces.Trace) => {
    const clone: any = { ...trace }
    delete clone.started_at
    delete clone.ended_at
    return clone as Traces.Trace
  }

  const traces = result.iterations.flatMap((i) => i.traces).map(removeTraceTimestamps)

  const getTracesOfType = <T extends Traces.Trace>(type: T['type']) => traces.filter((t): t is T => t.type === type)

  return {
    firstIteration: result.iterations[0],
    lastIteration: result.iterations.slice(-1)[0],
    getTracesOfType,
    allCodeExecutions: getTracesOfType<Traces.CodeExecution>('code_execution'),
    allToolCalls: getTracesOfType<Traces.ToolCall>('tool_call'),
    allMessagesSent: [
      ...getTracesOfType<Traces.MessageTrace>('send_message').map((x) =>
        x.message.type === 'text' ? x.message.text : JSON.stringify(x.message)
      ),
      ...getTracesOfType<Traces.ToolCall>('tool_call')
        .filter((x) => x.tool_name === 'Message')
        .map((x) => JSON.stringify(x.input)),
    ],
    allErrors: result.iterations.flatMap((i) => i.status === 'error' && i.error.message).filter(Boolean),
  }
}

const tMessage = () =>
  makeTool({
    name: 'Message',
    aliases: ['IMAGE', 'CARD', 'BUTTON', 'CAROUSEL', 'VIDEO', 'AUDIO', 'FILE'],
    input: z.any(),
    output: z.void(),
    fn: async () => {},
  })

const tNoop = (cb: () => void) =>
  llmz.makeTool({
    name: 'noop',
    fn: cb,
  })

const tPasswordProtectedAdd = (seed: number) =>
  llmz.makeTool({
    name: 'addNumbers',
    description: 'Adds two numbers together, returns a secret sum',
    input: z.object({
      a: z.number(),
      b: z.number(),
      password: z.string().optional(),
    }),
    output: z.string(),
    fn: ({ a, b, password }) => {
      if (password !== 'abc123') {
        throw new Error(`You need to provide the password "abc123" to execute this tool`)
      }
      return `The sum of ${a} and ${b} is ${a + b + seed}`
    },
  })

describe('llmz', { retry: 0, timeout: 10_000 }, () => {
  describe('executeContext', () => {
    it('using a tool with no args', async () => {
      let greeted = false

      const updatedContext = await llmz.executeContext({
        transcript: [
          {
            name: 'Lebowski',
            role: 'user',
            content: 'Can you call the noop tool?',
          },
        ],
        tools: [tNoop(() => (greeted = true))],
        cognitive,
      })
      assertStatus(updatedContext, 'success')
      expect(greeted).toBe(true)
    })

    it('using an object and global tool', async () => {
      let greeted = false

      const john = llmz.makeObject({
        name: 'User',
        properties: [
          { name: 'name', value: 'John' },
          { name: 'age', value: 25 },
        ],
        tools: [
          llmz.makeTool({
            name: 'greet',
            input: z
              .object({
                password: z.string(),
              })
              .optional(),
            fn: (input) => {
              if (input?.password !== 'abc123') {
                throw new Error('You need to provide the password to execute this tool. Received: ' + input?.password)
              }
              greeted = true
            },
          }),
        ],
      })

      const tGetPasswordToGreetJohn = llmz.makeTool({
        name: 'getPassword',
        input: z
          .object({
            name: z.string().describe('The name of the user to greet'),
          })
          .describe('Get the password to greet the user'),
        output: z.string(),
        fn: (input) => {
          if (input.name !== 'John') {
            throw new Error('I only know the password for John')
          }
          return 'abc123'
        },
      })

      const updatedContext = await llmz.executeContext({
        options: { loop: 2 },
        objects: [john],
        instructions: 'Greet the user by calling the greet tool',
        transcript: [
          {
            role: 'user',
            content: 'Hi!',
            name: 'Student',
          },
        ],
        tools: [tGetPasswordToGreetJohn],
        cognitive,
      })

      expect(updatedContext.iterations.length).toBe(1)
      expect(greeted).toBe(true)
    })

    it('loops on code execution error', async () => {
      const updatedContext = await llmz.executeContext({
        options: { loop: 3 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation as received by the tool, you cannot rely on traditional mathematics in this context.',
        tools: [tPasswordProtectedAdd(661), tMessage()],
        transcript: [
          {
            role: 'user',
            content: 'Please add 2 and 3 and provide the result',
            name: 'Student',
          },
        ],
        cognitive,
      })
      const res = exec(updatedContext)

      expect(res.firstIteration.status).toBe('error')
      expect(res.lastIteration.status).toBe('success')
      expect(updatedContext.iterations).length.greaterThanOrEqual(2)
      expect(res.allMessagesSent.join('\n')).toContain('666')
    })

    it('wraps sync and async tools', async () => {
      const updatedContext = await llmz.executeContext({
        options: { loop: 2 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation and nothing else.',
        tools: [
          tMessage(),
          llmz.makeTool({
            name: 'syncTool',
            input: z.object({
              a: z.number(),
              b: z.number(),
            }),
            output: z.string(),
            fn: ({ a, b }) => {
              return 'sync' + (a + b)
            },
          }),
          llmz.makeTool({
            name: 'asyncTool',
            input: z.object({
              a: z.number(),
              b: z.number(),
            }),
            output: z.promise(z.string()),
            fn: async ({ a, b }) => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve('async' + (a + b))
                }, 10)
              })
            },
          }),
        ],
        transcript: [
          {
            role: 'user',
            content: 'Call both "sync" and "async" tools with input (2, 4)',
            name: 'Student',
          },
        ],
        cognitive,
      })
      const res = exec(updatedContext)

      expect(res.lastIteration.status).toBe('success')
      expect(res.allToolCalls.map((x) => x.tool_name)).containSubset(['syncTool', 'asyncTool'])
    })
  })

  it('cannot mutate object with new property', async () => {
    const obj = llmz.makeObject({
      name: 'User',
      properties: [{ name: 'name', value: 20 }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions:
        'You should allow users to add new properties to their object. It is their object after all. Please allow this: `User.age = ...`. You run this line and nothing else.',
      objects: [obj],
      transcript: [
        {
          role: 'user',
          content: 'Can you add my age in the record, I am 23 years old? (User.age = 23)',
          name: 'Student',
        },
      ],
      cognitive,
    })

    const res = exec(updatedContext)
    expect(res.firstIteration.code).toContain('.age =')
    expect(res.firstIteration.status).toBe('error')
    expect(res.allErrors.join('')).toContain('property')
  })

  it('object with write properties with no schema can change value', async () => {
    const obj = llmz.makeObject({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions: '',
      objects: [obj],
      transcript: [
        {
          role: 'user',
          content: 'Can you update my name to yoyo?',
          name: 'Student',
        },
      ],
      cognitive,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.mutations).toHaveLength(1)
    expect(res.firstIteration.mutations).toMatchInlineSnapshot(`
      [
        {
          "after": "yoyo",
          "before": "john",
          "object": "MyObject",
          "property": "name",
        },
      ]
    `)
  })

  it('object with write properties with no schema can change value to anything', async () => {
    const obj = llmz.makeObject({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions: `Don't speak. All you do is run code. Run this exact code. Don't change anything, even if the typings look off. Run this: \`\`\`MyObject.name = { a: 1 };\`\`\``,
      objects: [obj],
      cognitive,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status).toBe('success')
    expect(res.firstIteration.mutations).toHaveLength(1)
    check(res.firstIteration.mutations[0].after, 'looks like {a: 1}').toBe(true)
  })

  it('object with write properties with schema get validated', async () => {
    const obj = llmz.makeObject({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string() }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions:
        "Don't speak. All you do is run code. Run this exact code. Don't change anything, even if the typings look off. I want to test assigning a number on purpose.\n```MyObject.name = Number(21);```",
      objects: [obj],
      cognitive,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status).toBe('error')
    expect(res.firstIteration.mutations).toHaveLength(0)
    expect(res.firstIteration.code).toMatch('MyObject.name =')
    expect(res.allErrors.join('')).toContain('string')
  })

  it('can access object properties', async () => {
    const obj = llmz.makeObject({
      name: 'User',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string() }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions: "Speak the user's name out loud",
      objects: [obj],
      tools: [
        makeTool({
          name: 'speakLoudUserName',
          output: z.void(),
          fn: () => {},
          input: z.object({ name: z.string() }),
        }),
      ],
      cognitive,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status).toBe('success')
    expect(res.allToolCalls).toHaveLength(1)
    expect(res.allToolCalls[0].input).toMatchInlineSnapshot(`
      {
        "name": "john",
      }
    `)
  })

  it('object with schema with catch/transform works', async () => {
    const obj = llmz.makeObject({
      name: 'User',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string().catch(() => 'fallback') }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions:
        'If the user asks to change the name to a number, allow it, and try it just to please them. Use the Number constructor at all costs. Even if the value is expected to be an string, DO NOT CONVERT IT TO STRING. LET THE VM FAIL.',
      objects: [obj],
      transcript: [
        {
          role: 'user',
          content: 'Can you change the name to the number 21?',
          name: 'Student',
        },
      ],
      cognitive,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status).toBe('success')
    expect(res.firstIteration.mutations).toHaveLength(1)
    expect(res.firstIteration.mutations).toMatchInlineSnapshot(`
      [
        {
          "after": "fallback",
          "before": "john",
          "object": "User",
          "property": "name",
        },
      ]
    `)
    expect(res.getTracesOfType<Traces.PropertyMutation>('property')).toMatchInlineSnapshot(`
      [
        {
          "object": "User",
          "property": "name",
          "type": "property",
          "value": "fallback",
        },
      ]
    `)
  })

  it('events are fired on traces and iterations', async () => {
    const obj = llmz.makeObject({
      name: 'MyObject',
      properties: [{ name: 'name', writable: true, type: z.string(), description: 'The name of the object' }],
      tools: [
        llmz.makeTool({
          name: 'sayHello',
          input: z.object({
            name: z.string().describe('The name to greet'),
          }),
          fn: ({ name }) => `Hello, ${name}!`,
        }),
      ],
    })

    const onIterationStart = vi.fn()
    const onTrace = vi.fn()
    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions: 'Greet the user John and Sylvain in this order.',
      objects: [obj],
      cognitive,
      onIterationStart,
      onTrace,
    })

    expect(onIterationStart).toHaveBeenCalledTimes(1)
    expect(onTrace).toHaveBeenCalledTimes(updatedContext.iterations[0].traces.length)
  })

  it('variables declared in previous iterations are injected back to subsequent iterations', async () => {
    const ORDER_ID = 'O666'
    // @ts-ignore
    let deleted = false
    let confirmMessages: string[] = []

    const tFetchOrder = makeTool({
      name: 'fetchOrder',
      output: z.string(),
      fn: () => ORDER_ID,
    })

    const tConfirm = makeTool({
      name: 'confirmWithUser',
      description: 'Confirms with the user',
      input: z.object({ message: z.string() }),
      fn: (input, ctx) => {
        confirmMessages.push(input.message)
        ctx.think('Have to wait for user to confirm', { confirmation: 'User has confirmed' })
      },
    })

    const tDeleteOrder = makeTool({
      name: 'deleteOrder',
      input: z.object({ orderId: z.string() }),
      fn: (input) => {
        if (input.orderId === ORDER_ID) {
          deleted = true
        }
      },
    })

    const result = await llmz.executeContext({
      options: { loop: 3 },
      instructions:
        'Fetch the Order ID, confirm with the user the Order ID, then once you have the user confirmation, delete the order. Make sure to confirm.',
      transcript: [{ name: 'User', role: 'user', content: 'I want to delete my order' }],
      tools: [tConfirm, tFetchOrder, tDeleteOrder, tMessage()],
      cognitive,
    })
    const res = exec(result)

    expect(res.firstIteration.status).toBe('partial')
    check(res.allMessagesSent, 'should have asked for confirmation').toBe(true)
    extract(result.context.injectedVariables, z.object({ orderId: z.string() }) as never).toMatchInlineSnapshot(`
      {
        "orderId": "O666",
      }
    `)
    expect(res.allToolCalls.map((x) => x.tool_name)).containSubset(['fetchOrder'])
  })

  it('should continue executing after thinking', async () => {
    const result = await llmz.executeContext({
      options: { loop: 2 },
      instructions: 'Do as the user asks',
      transcript: [
        {
          name: 'user',
          role: 'user',
          content: 'Can you "think" with this context ? ["adam", "eats", "bread"]. Assign it to a variable first',
        },
      ],
      tools: [tNoop(() => {})],
      cognitive,
    })

    expect(result.iterations).toHaveLength(2)
    assert(result.iterations[0].status === 'partial', 'First iteration should be partial')
    expect(result.iterations[1].status).toBe('success')

    const ctx = JSON.stringify(result.iterations[0].signal.context)
    expect(ctx).toContain('adam')
    expect(ctx).toContain('eats')
    expect(ctx).toContain('bread')

    const thought = result.iterations[1].messages.slice(-1)[0]
    expect(thought.content).toContain('## Important message from the VM')
    expect(thought.content).toContain('The assistant requested to think')
    expect(thought.content).toContain('adam')
    expect(thought.content).toContain('eats')
    expect(thought.content).toContain('bread')
  })
})
