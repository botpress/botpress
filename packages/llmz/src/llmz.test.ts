import { z } from '@bpinternal/zui'

import { beforeAll, afterAll, assert, describe, expect, it, vi } from 'vitest'
import * as llmz from './llmz.js'
import { Tool } from './tool.js'

import { ErrorExecutionResult, ExecutionResult, SuccessExecutionResult } from './result.js'
import { Traces } from './types.js'
import { getCachedCognitiveClient, getCorgiUrl } from './__tests__/index.js'
import { ObjectInstance } from './objects.js'
import { Exit, ExitResult } from './exit.js'
import { DefaultComponents } from './component.default.js'
import { ThinkSignal } from './errors.js'
import { Chat } from './chat.js'
import { Transcript } from './transcript.js'

const client = getCachedCognitiveClient()

function assertSuccess(result: ExecutionResult): asserts result is SuccessExecutionResult {
  assert(
    result instanceof SuccessExecutionResult,
    `Expected result to be success but got ${result.status}\n${result.isError() ? result.error : ''}`.trim()
  )
}

function assertError(result: ExecutionResult): asserts result is ErrorExecutionResult {
  assert(result instanceof ErrorExecutionResult, `Expected result to be error but got ${result.status}`)
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
      ...getTracesOfType<Traces.ToolCall>('tool_call')
        .filter((x) => x.tool_name?.toLowerCase() === 'message')
        .map((x) => JSON.stringify(x.input)),
    ],
    allErrors: result.iterations.flatMap((i) => i.error).filter(Boolean),
  }
}

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
        instructions: `Can you call the noop tool? My name is Lebowsi.`,
        exits: [eDone],
        tools: [tNoop(() => (greeted = true))],
        client,
      })

      assertSuccess(updatedContext)
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
        tools: [tGetPasswordToGreetJohn],
        client,
        exits: [eDone],
      })

      expect(updatedContext.status).toBe('success')
      expect(greeted).toBe(true)
    })

    it('loops on code execution error', async () => {
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [
          {
            role: 'user',
            content: 'Please add 2 and 3 and provide the result',
            name: 'Student',
          },
        ],
        handler: async () => {},
      })

      const updatedContext = await llmz.executeContext({
        options: { loop: 3 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation as received by the tool, you cannot rely on traditional mathematics in this context.',
        chat,
        tools: [tPasswordProtectedAdd(661)],
        client,
      })

      const res = exec(updatedContext)

      expect(res.firstIteration?.status.type).toBe('execution_error')
      expect(res.lastIteration?.status.type).toBe('exit_success')
      expect(updatedContext.iterations).length.greaterThanOrEqual(2)
      expect(res.allMessagesSent.join('\n')).toContain('666')
    })

    it('wraps sync and async tools', async () => {
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [
          {
            role: 'user',
            content: 'Call both "sync" and "async" tools with input (2, 4)',
            name: 'Student',
          },
        ],
        handler: async () => {},
      })

      const updatedContext = await llmz.executeContext({
        options: { loop: 2 },
        instructions:
          'You are a calculator at the service of the user. You need to answer with the result of the operation and nothing else.',

        tools: [
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
        chat,
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
        'You should allow users to add new properties to their object. It is their object after all. Please allow this: `User.age = ...`. You run this line and nothing else. Can you add my age in the record, I am 23 years old? (User.age = 23)',
      objects: [obj],
      exits: [eDone],
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
      instructions: 'Can you update my name to yoyo?',
      objects: [obj],
      exits: [eDone],
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
      instructions: 'Run this exact code (even if typings look off): ```User.name = Number(21);```',
      objects: [obj],
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
        instructions: 'What is my favorite animal?',
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
        instructions: 'What is my favorite plant?',
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
          'just call return { action: "is_plant", value: { edible: "yes" } } and nothing else. you already know the plant. Don\'t try to provide the plant name, it is already known.\nASK: What is my favorite plant?',
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
          "color": "unknown",
          "edible": true,
          "plant": "unknown",
        }
      `)
    })

    it("exit hook is called before exiting and can't mutate value", async () => {
      let exitResult: ExitResult
      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        tools: [tAnimal, tPlant],
        instructions: 'What is my favorite plant?',
        client,
        onExit: (async (result) => {
          exitResult = result
          return { ...result.result, plant: 'Monstera' } // This should not mutate the value
        }) as any,
      })

      assert(ePlant.match(exitResult!) === true)
      expect(exitResult.result).toMatchInlineSnapshot(`
        {
          "color": "green",
          "edible": false,
          "plant": "Monstera",
        }
      `)
      assertSuccess(result)
      assert(ePlant.match(result.result))
    })

    it('exit hook is awaited before exiting and errors the iteration on error', async () => {
      let exitCalled = false

      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [ePlant, eAnimal],
        tools: [tAnimal, tPlant],
        instructions: 'What is my favorite plant?',
        client,
        onExit: async (_) => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          exitCalled = true
          throw new Error('This is an error in the exit hook')
        },
      })

      expect(exitCalled).toBe(true)
      assertError(result)
      expect(result.iterations).toHaveLength(2)
      assert(result.iteration?.status.type === 'exit_error', 'Second iteration should be an exit error')
      expect(result.iteration?.status.exit_error).toMatchInlineSnapshot(`
        {
          "exit": "is_plant",
          "message": "Error executing exit is_plant: This is an error in the exit hook",
          "return_value": {
            "action": "is_plant",
            "value": {
              "color": "green",
              "edible": false,
              "plant": "Monstera",
            },
          },
        }
      `)
    })
  })

  describe('abort signals', () => {
    it('can abort execution', async () => {
      const controller = new AbortController()
      const signal = controller.signal

      const tLongRunning = new Tool({
        name: 'longRunning',
        description: 'A tool that runs for a long time',
        input: z.void(), // No input
        output: z.object({ token: z.string().describe('Authorization token') }),
        handler: async () => {
          // Simulate a long-running operation
          await new Promise((resolve) => setTimeout(resolve, 50))
          controller.abort('ABORTED')
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return { token: '123456' }
        },
      })

      const result = await llmz.executeContext({
        options: { loop: 2 },
        exits: [eDone],
        instructions: 'Give me an authorization token',
        tools: [tLongRunning],
        client,
        signal,
      })

      assertError(result)
      expect(result.iterations).toHaveLength(1)
      expect(result.error).toMatch('ABORTED')
    })

    it('abort inside hooks stops loop', async () => {
      const controller = new AbortController()
      const signal = controller.signal
      let times = 0

      const tRecursive = new Tool({
        name: 'recursive',
        handler: async () => {
          throw new ThinkSignal(`You called this tool ${++times} times. You need to call this tool again.`)
        },
      })

      const result = await llmz.executeContext({
        options: { loop: 10 },
        exits: [eDone],
        instructions: 'Call the recursive tool until it stops asking for more calls',
        tools: [tRecursive],
        onIterationEnd: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100))

          if (times >= 3) {
            controller.abort('ABORTED')
          }
        },
        client,
        signal,
      })

      assertError(result)
      expect(result.iterations).toHaveLength(4)
      expect(result.error).toMatch('ABORTED')
    })
  })

  it('execution error stack trace', async () => {
    const tDemo = new Tool({
      name: 'demo',
      handler: async () => {
        throw new Error('This is a demo error')
      },
    })

    const result = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
      instructions: 'Call the demo tool',
      tools: [tDemo],
      client,
    })

    assertError(result)
    expect(result.iterations).toHaveLength(1)
    assert(result.iterations[0]!.status.type === 'execution_error', 'First iteration should be an execution error')
    expect(result.iterations[0]!.status.execution_error.stack).toMatchInlineSnapshot(`
      "001 | // Calling the demo tool as per the instructions
        002 | await demo()
      > 003 | return { action: 'done' }
      ...^^^^^^^^^^"
    `)
  })

  it('beforeExecute hook (mutate code)', async () => {
    let calls: string[] = []

    const tDemo = new Tool({
      name: 'demo',
      input: z.string(),
      handler: async (input) => {
        calls.push(input)
        return 'Hello, World!'
      },
    })

    const result = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eDone],
      instructions: 'exit by doing nothing. do not call any tool.',
      tools: [tDemo],
      client,
      async onBeforeExecution() {
        await new Promise((resolve) => setTimeout(resolve, 10))
        // Mutate the code to change the action

        return { code: `await demo('hello 123');\nreturn { action: 'done' }` }
      },
    })

    assertSuccess(result)
    expect(result.iterations).toHaveLength(1)
    expect(calls).toMatchInlineSnapshot(`
      [
        "hello 123",
      ]
    `)
  })

  it('onBeforeTool and onAfterTool hooks (mutate input and output)', async () => {
    let originalInputName: string | undefined
    let calledInputName: string | undefined

    const tGreeting = new Tool({
      name: 'greeting',
      input: z.object({
        name: z.string(),
      }),
      output: z.string(),
      handler: async ({ name }) => {
        calledInputName = name
        return `Hi there, ${name}!`
      },
    })

    const eWithResult = new Exit({
      name: 'done',
      description: 'call this when you are done',
      schema: z.object({
        greeting: z.string(),
      }),
    })

    const result = await llmz.executeContext({
      options: { loop: 1 },
      exits: [eWithResult],
      instructions: 'Call the greeting tool with name "Alice" and exit right after with the result.',
      tools: [tGreeting],
      client,
      async onBeforeTool({ input }) {
        originalInputName = input.name
        return { input: { name: 'Jacques' } }
      },
      async onAfterTool({ output }) {
        return { output: output.toUpperCase() }
      },
    })

    assertSuccess(result)
    expect(result.iterations).toHaveLength(1)
    assert(result.is(eWithResult), 'Result should be an exit success with the expected exit')

    expect(originalInputName).toBe('Alice')
    expect(calledInputName).toBe('Jacques')
    expect(result.output.greeting).toMatchInlineSnapshot(`"HI THERE, JACQUES!"`)
  })

  describe('images', () => {
    it('handles image attachments', async () => {
      let dogMentionned = false
      const exit = new Exit({ name: 'done', description: 'call this when you are done' })
      const url = await getCorgiUrl()
      const chat = new Chat({
        components: [DefaultComponents.Text],
        transcript: [
          {
            role: 'user',
            content: 'Describe accurately what you see in the image?',
            attachments: [{ type: 'image', url }],
          } satisfies Transcript.UserMessage,
        ],
        handler: async (msg) => {
          let content = JSON.stringify(msg).toLowerCase()
          dogMentionned ||= content.includes('corgi') || content.includes('dog')
        },
      })

      const result = await llmz.executeContext({
        instructions: 'Do as the user says. You can see images.',
        options: { loop: 1 },
        exits: [exit],
        chat,
        client,
      })

      assertSuccess(result)
      expect(result.iterations).toHaveLength(1)
      expect(dogMentionned).toBe(true)
    }, 20_000)
  })
})
