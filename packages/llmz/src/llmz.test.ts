import { z } from '@bpinternal/zui'

import { assert, describe, expect, it, vi } from 'vitest'
import { llmz } from './llmz.js'
import { Tool } from './tool.js'

import { ExecutionResult, Traces } from './types.js'
import { getCachedCognitiveClient } from './__tests__/index.js'
import { ObjectInstance } from './objects.js'
import { Exit } from './exit.js'
import { DefaultComponents } from './component.default.js'
import { beforeAll } from 'vitest'

const client = getCachedCognitiveClient()

function assertStatus<S extends ExecutionResult['status']>(
  result: ExecutionResult,
  status: S
): asserts result is ExecutionResult & { status: S } {
  const error = result.status === 'error' ? result.error : null

  if (result.status === 'error' && status !== 'error') {
    throw new Error(`Expected status to be "${status}" but got error: ${error}`)
  }

  assert(result.status === status, `Expected status to be "${status}" but got "${result.status}"`)
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
    firstIteration: result.iterations[0]!,
    lastIteration: result.iterations.slice(-1)[0],
    getTracesOfType,
    allCodeExecutions: getTracesOfType<Traces.CodeExecution>('code_execution'),
    allToolCalls: getTracesOfType<Traces.ToolCall>('tool_call') ?? [],
    allMessagesSent: [
      ...getTracesOfType<Traces.MessageTrace>('send_message').map((x) =>
        x.message.type === 'text' ? x.message.text : JSON.stringify(x.message)
      ),
      ...getTracesOfType<Traces.ToolCall>('tool_call')
        .filter((x) => x.tool_name?.toLowerCase() === 'message')
        .map((x) => JSON.stringify(x.input)),
    ],
    allErrors: result.iterations.flatMap((i) => i.error).filter(Boolean),
  }
}

const tMessage = () =>
  new Tool({
    name: 'Message',
    aliases: ['IMAGE', 'CARD', 'BUTTON', 'CAROUSEL', 'VIDEO', 'AUDIO', 'FILE'],
    input: z.any(),
    output: z.void(),
    handler: async () => {},
  })

const tNoop = (cb: () => void) =>
  new Tool({
    name: 'noop',
    output: z.void(),
    handler: async () => cb(),
  })

const eDone = new Exit({ name: 'done', description: 'call this when you are done' })

const tPasswordProtectedAdd = (seed: number) =>
  new Tool({
    name: 'addNumbers',
    description: 'Adds two numbers together, returns a secret sum',
    input: z.object({
      a: z.number(),
      b: z.number(),
      password: z.string().optional(),
    }),
    output: z.string(),
    handler: async ({ a, b, password }) => {
      if (password !== 'abc123') {
        throw new Error(`You need to provide the password "abc123" to execute this tool`)
      }
      return `The sum of ${a} and ${b} is ${a + b + seed}`
    },
  })

describe('llmz', { retry: 0, timeout: 10_000 }, () => {
  let unsub = () => {}

  beforeAll(() => {
    unsub = client.on('error', (req, err) => {
      console.error('Error from cognitive client', req, err)
    })
  })

  afterAll(() => {
    unsub()
  })

  describe('executeContext', () => {
    it('using a tool with no args', async () => {
      let greeted = false

      const updatedContext: ExecutionResult = await llmz.executeContext({
        transcript: [
          {
            name: 'Lebowski',
            role: 'user',
            content: 'Can you call the noop tool?',
          },
        ],
        exits: [eDone],
        tools: [tNoop(() => (greeted = true))],
        client,
      })

      assertStatus(updatedContext, 'success')

      expect(greeted).toBe(true)
    })

    it('using an object and global tool', async () => {
      let greeted = false

      const john = new ObjectInstance({
        name: 'User',
        properties: [
          { name: 'name', value: 'John' },
          { name: 'age', value: 25 },
        ],
        tools: [
          new Tool({
            name: 'greet',
            input: z
              .object({
                password: z.string(),
              })
              .optional(),
            handler: async (input) => {
              if (input?.password !== 'abc123') {
                throw new Error('You need to provide the password to execute this tool. Received: ' + input?.password)
              }
              greeted = true
            },
          }),
        ],
      })

      const tGetPasswordToGreetJohn = new Tool({
        name: 'getPassword',
        input: z
          .object({
            name: z.string().describe('The name of the user to greet'),
          })
          .describe('Get the password to greet the user'),
        output: z.string(),
        handler: async (input) => {
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
        client,
        exits: [eDone],
      })

      expect(updatedContext.status).toBe('success')
      expect(greeted).toBe(true)
    })

    it('loops on code execution error', async () => {
      const updatedContext = await llmz.executeContext({
        options: { loop: 3 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation as received by the tool, you cannot rely on traditional mathematics in this context.',
        components: [DefaultComponents.Text],
        tools: [tPasswordProtectedAdd(661), tMessage()],
        transcript: [
          {
            role: 'user',
            content: 'Please add 2 and 3 and provide the result',
            name: 'Student',
          },
        ],
        client,
      })

      const res = exec(updatedContext)

      expect(res.firstIteration?.status.type).toBe('execution_error')
      expect(res.lastIteration?.status.type).toBe('exit_success')
      expect(updatedContext.iterations).length.greaterThanOrEqual(2)
      expect(res.allMessagesSent.join('\n')).toContain('666')
    })

    it('wraps sync and async tools', async () => {
      const updatedContext = await llmz.executeContext({
        options: { loop: 2 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation and nothing else.',
        components: [DefaultComponents.Text],
        tools: [
          tMessage(),
          new Tool({
            name: 'syncTool',
            input: z.object({
              a: z.number(),
              b: z.number(),
            }),
            output: z.string(),
            handler: async ({ a, b }) => {
              return 'sync' + (a + b)
            },
          }),
          new Tool({
            name: 'asyncTool',
            input: z.object({
              a: z.number(),
              b: z.number(),
            }),
            output: z.string(),
            handler: async ({ a, b }) => {
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
        client,
      })
      const res = exec(updatedContext)

      expect(res.lastIteration?.status.type).toBe('exit_success')
      expect(res.allToolCalls.map((x) => x.tool_name)).containSubset(['syncTool', 'asyncTool'])
    })
  })

  it('cannot mutate object with new property', async () => {
    const obj = new ObjectInstance({
      name: 'User',
      properties: [{ name: 'name', value: 20 }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions:
        'You should allow users to add new properties to their object. It is their object after all. Please allow this: `User.age = ...`. You run this line and nothing else.',
      objects: [obj],
      exits: [eDone],
      transcript: [
        {
          role: 'user',
          content: 'Can you add my age in the record, I am 23 years old? (User.age = 23)',
          name: 'Student',
        },
      ],
      client,
    })

    const res = exec(updatedContext)
    expect(res.firstIteration?.code).toContain('.age =')
    expect(res.firstIteration?.status.type).toBe('execution_error')
    expect(res.allErrors.join('')).toContain('property')
  })

  it('object with write properties with no schema can change value', async () => {
    const obj = new ObjectInstance({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      instructions: '',
      objects: [obj],
      exits: [eDone],
      transcript: [
        {
          role: 'user',
          content: 'Can you update my name to yoyo?',
          name: 'Student',
        },
      ],
      client,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration?.mutations).toHaveLength(1)
    expect(res.firstIteration?.mutations).toMatchInlineSnapshot(`
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
    const obj = new ObjectInstance({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
      instructions: `Don't speak. All you do is run code. Run this exact code. Don't change anything, even if the typings look off. Run this: \`\`\`MyObject.name = { a: 1 };\`\`\``,
      objects: [obj],
      client,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration?.status.type).toBe('exit_success')
    expect(res.firstIteration?.mutations).toHaveLength(1)
    expect(res.firstIteration.mutations[0]!.property).toBe('name')
    expect(res.firstIteration.mutations[0]!.after).toMatchInlineSnapshot(`
      {
        "a": 1,
      }
    `)
  })

  it('object with write properties with schema get validated', async () => {
    const obj = new ObjectInstance({
      name: 'MyObject',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string() }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
      instructions:
        "Don't speak. All you do is run code. Run this exact code. Don't change anything, even if the typings look off. I want to test assigning a number on purpose.\n```MyObject.name = Number(21);```",
      objects: [obj],
      client,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status.type).toBe('execution_error')
    expect(res.firstIteration.mutations).toHaveLength(0)
    expect(res.firstIteration.code).toMatch('MyObject.name =')
    expect(res.allErrors.join('')).toContain('string')
  })

  it('can access object properties', async () => {
    const obj = new ObjectInstance({
      name: 'User',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string() }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
      instructions: "Speak the user's name out loud",
      objects: [obj],
      tools: [
        new Tool({
          name: 'speakLoudUserName',
          output: z.void(),
          handler: async () => {},
          input: z.object({ name: z.string() }),
        }),
      ],
      client,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status.type).toBe('exit_success')
    expect(res.allToolCalls).toHaveLength(1)
    expect(res.allToolCalls[0]!.input).toMatchInlineSnapshot(`
      {
        "name": "john",
      }
    `)
  })

  it('object with schema with catch/transform works', async () => {
    const obj = new ObjectInstance({
      name: 'User',
      properties: [{ name: 'name', value: 'john', writable: true, type: z.string().catch(() => 'fallback') }],
    })

    const updatedContext = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
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
      client,
    })
    const res = exec(updatedContext)

    expect(res.firstIteration.status.type).toBe('exit_success')
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
    const obj = new ObjectInstance({
      name: 'MyObject',
      properties: [
        { name: 'name', writable: true, type: z.string(), description: 'The name of the object', value: undefined },
      ],
      tools: [
        new Tool({
          name: 'sayHello',
          input: z.object({
            name: z.string().describe('The name to greet'),
          }),
          handler: async ({ name }) => `Hello, ${name}!`,
        }),
      ],
    })

    const onTrace = vi.fn()
    const updatedContext = await llmz.executeContext({
      exits: [eDone],
      options: { loop: 1 },
      instructions: 'Greet the user John and Sylvain in this order.',
      objects: [obj],
      client,
      onTrace,
    })

    expect(onTrace).toHaveBeenCalledTimes(updatedContext.iterations[0]!.traces.length)
  })

  it('variables declared in previous iterations are injected back to subsequent iterations', async () => {
    const ORDER_ID = 'O666'
    // @ts-ignore
    let deleted = false
    let confirmMessages: string[] = []

    const tFetchOrder = new Tool({
      name: 'fetchOrder',
      output: z.string(),
      handler: async () => ORDER_ID,
    })

    const tConfirm = new Tool({
      name: 'confirmWithUser',
      description: 'Confirms with the user',
      input: z.object({ message: z.string() }),
      handler: async (input) => {
        confirmMessages.push(input.message)
      },
    })

    const tDeleteOrder = new Tool({
      name: 'deleteOrder',
      input: z.object({ orderId: z.string() }),
      handler: async (input) => {
        if (input.orderId === ORDER_ID) {
          deleted = true
        }
      },
    })

    const result = await llmz.executeContext({
      options: { loop: 3 },
      exits: [eDone] as const,
      instructions:
        'Fetch the Order ID, confirm with the user the Order ID, then once you have the user confirmation, delete the order. Make sure to confirm.',
      transcript: [{ name: 'User', role: 'user', content: 'I want to delete my order' }],
      tools: [tConfirm, tFetchOrder, tDeleteOrder],
      client,
    })

    const res = exec(result)

    expect(res.firstIteration.status.type).toBe('thinking_requested')
    expect(confirmMessages).length(1)
    expect(result.context.iterations.at(-1)?.variables).toMatchInlineSnapshot(`
      {
        "orderId": "O666",
      }
    `)
    expect(res.allToolCalls.map((x) => x.tool_name)).containSubset(['fetchOrder'])
  })

  // TODO: fixme
  // it('should continue executing after thinking', async () => {
  //   const result = await llmz.executeContext({
  //     options: { loop: 2 },
  //     exits: [eDone],
  //     instructions: 'Do as the user asks',
  //     transcript: [
  //       {
  //         name: 'user',
  //         role: 'user',
  //         content: 'Can you "think" with this context ? ["adam", "eats", "bread"]. Assign it to a variable first',
  //       },
  //     ],
  //     tools: [tNoop(() => {})],
  //     client,
  //   })

  //   expect(result.iterations).toHaveLength(2)
  //   assert(result.iterations[0]!.status === 'partial', 'First iteration should be partial')
  //   expect(result.iterations[1]!.status).toBe('success')

  //   const ctx = JSON.stringify(result.iterations[0]!.signal.context)
  //   expect(ctx).toContain('adam')
  //   expect(ctx).toContain('eats')
  //   expect(ctx).toContain('bread')

  //   const thought = result.iterations[1]!.messages.slice(-1)[0]
  //   expect(thought?.content).toContain('## Important message from the VM')
  //   expect(thought?.content).toContain('The assistant requested to think')
  //   expect(thought?.content).toContain('adam')
  //   expect(thought?.content).toContain('eats')
  //   expect(thought?.content).toContain('bread')
  // })

  describe('using the right exit', () => {
    const tAnimal = new Tool({
      name: 'animal',
      description: "Fetches the user's favorite animal",
      output: z.string(),
      handler: async () => `My favorite animal is a Corgi nammed Nikki. She's brown and white.`,
    })

    const tPlant = new Tool({
      name: 'plant',
      description: "Fetches the user's favorite plant",
      output: z.string(),
      handler: async () => `My favorite plant is a Monstera. It's green and leafy.`,
    })

    const ePlant = new Exit({
      name: 'is_plant',
      description: 'the final result is a plant',
      schema: z.object({ plant: z.string(), color: z.string(), edible: z.boolean() }),
    })

    const eAnimal = new Exit({
      name: 'is_animal',
      description: 'the final result is an animal',
      schema: z.object({ animal: z.string(), color: z.string(), domestic: z.boolean() }),
    })

    it('uses the right exit (1)', async () => {
      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        instructions: 'Do as the user asks',
        transcript: [
          {
            name: 'user',
            role: 'user',
            content: 'What is my favorite animal?',
          },
        ],
        tools: [tAnimal, tPlant],
        client,
      })

      expect(result.iterations).toHaveLength(2)
      assert(result.iterations[0]!.status.type === 'thinking_requested', 'First iteration should be partial')
      expect(result.iterations[1]!.status.type).toBe('exit_success')
      expect(result.iterations[1]!.status.type === 'exit_success' && result.iterations[1]!.status.exit_success)
        .toMatchInlineSnapshot(`
        {
          "exit_name": "is_animal",
          "return_value": {
            "animal": "Corgi",
            "color": "brown and white",
            "domestic": true,
          },
        }
      `)
    })

    it('uses the right exit (2)', async () => {
      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        instructions: 'Do as the user asks',
        transcript: [
          {
            name: 'user',
            role: 'user',
            content: 'What is my favorite plant?',
          },
        ],
        tools: [tAnimal, tPlant],
        client,
      })

      expect(result.iterations).toHaveLength(2)
      assert(result.iterations[0]!.status.type === 'thinking_requested', 'First iteration should be partial')
      expect(result.iterations[1]!.status.type).toBe('exit_success')
      expect(result.iterations[1]!.status.type === 'exit_success' && result.iterations[1]!.status.exit_success)
        .toMatchInlineSnapshot(`
        {
          "exit_name": "is_plant",
          "return_value": {
            "color": "green",
            "edible": false,
            "plant": "Monstera",
          },
        }
      `)
    })

    it('exit schema is validated', async () => {
      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        instructions:
          'just call return { action: "is_plant", value: { edible: "yes" } } and nothing else. you already know the plant. Don\'t try to provide the plant name, it is already known.',
        transcript: [
          {
            name: 'user',
            role: 'user',
            content: 'What is my favorite plant?',
          },
        ],
        tools: [tNoop(() => {})],
        client,
      })

      expect(result.iterations).toHaveLength(2)

      const [firstIteration, lastIteration] = result.iterations

      assert(!!firstIteration)
      assert(!!lastIteration)

      assert(firstIteration.isFailed())

      expect(firstIteration.status.type === 'exit_error' && firstIteration.error).toContain('Invalid return value')
      assert(lastIteration.hasExitedWith(ePlant))

      expect(lastIteration.status.exit_success.return_value).toMatchInlineSnapshot(`
        {
          "color": "",
          "edible": true,
          "plant": "",
        }
      `)
    })

    it('exit hook is called before exiting', async () => {
      let exitCalled = false
      let exitValue: any = null

      await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        tools: [tAnimal, tPlant],
        instructions: 'Do as the user asks',
        transcript: [
          {
            name: 'user',
            role: 'user',
            content: 'What is my favorite plant?',
          },
        ],
        client,
        onExit: async (_, value) => {
          exitCalled = true
          exitValue = value
        },
      })

      expect(exitCalled).toBe(true)
      expect(exitValue).toMatchInlineSnapshot(`
        {
          "color": "green",
          "edible": false,
          "plant": "Monstera",
        }
      `)
    })
  })
})
