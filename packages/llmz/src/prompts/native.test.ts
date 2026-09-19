import { z } from '@bpinternal/zui'
import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { Example } from '../example.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { resolveResponse } from '../response.js'
import { Tool } from '../tool.js'
import { getNativeExecutionState, getNativeSystemMessage, renderNativeExamples } from './native.js'

const listen = new Exit({ name: 'listen', description: 'Wait for the user.' })
const props = {
  instructions: 'Help with accounts.',
  components: [DefaultComponents.Button],
  exits: [listen],
  globalTools: [],
  objects: [],
}

describe('native prompt', () => {
  it('keeps conversation out of system text and documents business functions inside JavaScript', async () => {
    const tool = new Tool({
      name: 'readAccount',
      description: 'Read an account',
      input: z.object({ id: z.string() }),
      output: z.string(),
      handler: async () => 'Pro',
    })
    const { message, parts } = await getNativeSystemMessage({ ...props, globalTools: [tool] })
    expect(message.role).toBe('system')
    expect(message.content).not.toContain('LIVE USER INPUT')
    expect(message.content).not.toContain('■')
    expect(message.content).toContain('readAccount')
    expect(message.content).toContain('$iterations')
    expect(parts.transcript).toBe('')
  })

  it('supports plain chat with no registered components, and workers require a typed exit', async () => {
    const chat = await getNativeSystemMessage({ ...props, components: [], isChatEnabled: true })
    const worker = await getNativeSystemMessage({ ...props, components: [], isChatEnabled: false })
    expect(chat.message.content).toContain('normal assistant text')
    expect(chat.message.content).not.toContain('chat.')
    expect(chat.message.content).not.toContain('declare const chat:')
    expect(worker.message.content).toContain('prose alone does not complete')
  })

  it.each([
    { chat: true, hasExits: true },
    { chat: true, hasExits: false },
    { chat: false, hasExits: true },
    { chat: false, hasExits: false },
  ])('documents only available capabilities (chat=$chat, exits=$hasExits)', async ({ chat, hasExits }) => {
    const available = {
      ...props,
      components: Object.values(DefaultComponents),
      exits: hasExits ? [listen] : [],
      isChatEnabled: chat,
    }
    const { message } = await getNativeSystemMessage(available)
    const firstResponse = getNativeExecutionState({ ...available, iteration: { current: 1, limit: 2 } })
    const lastResponse = getNativeExecutionState({ ...available, iteration: { current: 2, limit: 2 } })
    const text = [message.content, firstResponse, lastResponse].join('\n')

    expect(text).toContain('Every run_javascript program must explicitly return inspect(value)')
    expect(text).not.toMatch(/\bexit\s*\(\s*\)/)
    expect(text).not.toMatch(/return is omitted|omit return|plain JavaScript return/i)

    if (hasExits) {
      expect(text).toContain('declare function exit(name: "listen")')
    } else {
      expect(text).not.toMatch(/\bexits?\b/i)
    }

    if (chat) {
      expect(text).toContain('declare const chat:')
    } else {
      expect(text).not.toMatch(/\bchat\b|component methods|Assistant text delivery/i)
    }
  })

  it.each([true, false])(
    'ends every framework JavaScript example with an explicit decision (exits=%s)',
    async (hasExits) => {
      const { parts } = await getNativeSystemMessage({
        ...props,
        components: Object.values(DefaultComponents),
        exits: hasExits ? [listen] : [],
      })
      const componentPrograms = [...parts.tools.matchAll(/```javascript\n([\s\S]*?)\n```/g)].map((match) => match[1]!)
      const syntaxPrograms = [...parts.protocol.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
        (match) => JSON.parse(match[1]!).code as string
      )

      expect(componentPrograms.length).toBeGreaterThan(0)

      for (const program of [...componentPrograms, ...syntaxPrograms]) {
        const tree = parse(program, { ecmaVersion: 'latest', allowReturnOutsideFunction: true })

        expect(tree.body.at(-1)).toMatchObject({
          type: 'ReturnStatement',
          argument: {
            type: 'CallExpression',
            callee: { type: 'Identifier', name: expect.stringMatching(/^(inspect|exit)$/) },
          },
        })
        expect(program).not.toMatch(/\bexit\s*\(\s*\)/)
      }

      for (const program of componentPrograms) {
        expect(program).toContain(hasExits ? 'return exit("listen");' : 'return inspect(undefined);')
      }
    }
  )

  it.each([false, true])('distinguishes declaring variables from reusing loaded memory (chat=%s)', async (chat) => {
    const { parts } = await getNativeSystemMessage({ ...props, isChatEnabled: chat })

    expect(parts.protocol).toContain('Declare new retained variables at top level with const or let')
    expect(parts.protocol).toContain('const count = 0')
    expect(parts.protocol).toContain('already declared in this program or listed in Memory; it never creates one')
    expect(parts.protocol).toContain('remain available across JavaScript calls and transcript compaction')
  })

  it('requires authorized recovery without overriding terminal task outcomes or execution limits', async () => {
    const { parts } = await getNativeSystemMessage({ ...props, isChatEnabled: false })

    expect(parts.protocol).toContain('When recovery is safe and authorized')
    expect(parts.protocol).toContain('retry failed work without repeating successful actions')
    expect(parts.protocol).toContain('let the error reach the runtime')
    expect(parts.protocol).toContain('recovery is unavailable, unsafe, forbidden')
    expect(parts.protocol).toContain('attempt or response budget is exhausted')
    expect(parts.protocol).toContain('Honor task instructions defining terminal failure outcomes')
    expect(parts.protocol).toContain('unchanged retries do not establish that recovery is exhausted')
    expect(parts.protocol).toContain('Without an implemented recovery handler, return inspect({ errors, completed })')
  })

  it('requires a matching task exit even when chat explains the outcome', async () => {
    const cancelled = new Exit({
      name: 'purchaseAbandoned',
      description: 'When payment fails and the purchase must be cancelled.',
      schema: z.object({ reason: z.string() }),
    })
    const typedChat = await getNativeSystemMessage({ ...props, exits: [listen, cancelled] })
    const ordinaryChat = await getNativeSystemMessage(props)

    expect(typedChat.parts.protocol).toContain('When a known outcome matches a registered task exit description')
    expect(typedChat.parts.protocol).toContain('even if you also explain the outcome in assistant text')
    expect(typedChat.parts.protocol).toContain('An apology or other prose does not select a typed exit')
    expect(typedChat.parts.protocol).toContain('Use return exit("listen") only when waiting for the user')
    expect(typedChat.parts.protocol).not.toContain('purchaseAbandoned')
    expect(typedChat.parts.tools).toContain('exit("purchaseAbandoned", payload)')
    expect(ordinaryChat.parts.protocol).not.toContain('An apology or other prose does not select a typed exit')
    expect(ordinaryChat.parts.protocol).toContain('A completed response without tool calls finishes the turn')
  })

  it.each(['markdown', 'text', 'speech'] as const)(
    'documents the %s response separately from components',
    async (preset) => {
      const response = resolveResponse(preset)
      const { message, parts } = await getNativeSystemMessage({ ...props, response })

      expect(parts.protocol).toContain('# Assistant response')
      expect(parts.protocol).toContain(response.instructions)
      expect(parts.protocol).toContain(`### Response example 1\n${response.examples[0]}`)
      expect(parts.tools).not.toContain(response.instructions)
      expect(message.content).not.toMatch(/chat\.(text|message|markdown|speech)\(/)
    }
  )

  it('renders custom response guidance without callbacks or worker leakage', async () => {
    const response = resolveResponse({
      instructions: 'CUSTOM_RESPONSE_INSTRUCTIONS',
      examples: ['CUSTOM_RESPONSE_EXAMPLE'],
      handler: function privateDeliveryImplementation() {},
      onDelta: function privateStreamingImplementation() {},
    })
    const chat = await getNativeSystemMessage({ ...props, response, isChatEnabled: true })
    const worker = await getNativeSystemMessage({ ...props, response, isChatEnabled: false })

    expect(chat.message.content).toContain('CUSTOM_RESPONSE_INSTRUCTIONS')
    expect(chat.message.content).toContain('CUSTOM_RESPONSE_EXAMPLE')
    expect(chat.message.content).not.toContain('Write natural Markdown')
    expect(chat.message.content).not.toContain('privateDeliveryImplementation')
    expect(chat.message.content).not.toContain('privateStreamingImplementation')
    expect(worker.message.content).not.toContain('# Assistant response')
    expect(worker.message.content).not.toContain('CUSTOM_RESPONSE_')
  })

  it('documents runtime decisions and presentation schemas in the JavaScript section', async () => {
    const done = new Exit({ name: 'done', description: 'Complete a count', schema: z.number().int() })
    const { message, parts } = await getNativeSystemMessage({ ...props, exits: [listen, done] })

    expect(parts.tools).toContain('declare function inspect<T>')
    expect(parts.tools).not.toContain('declare function exit()')
    expect(parts.tools).toContain('exit("done", payload)')
    expect(parts.tools).toMatch(/declare function exit\(name: ['"]done['"], payload: number\): never/)
    expect(parts.tools).toContain('Component "Button"')
    expect(parts.tools).toContain('label: string')
    expect(message.content).toContain('takes effect only when returned')
    expect(message.content).toContain('Every run_javascript program must explicitly return inspect(value)')
    expect(message.content).toContain('or return exit("NAME", payload) with a registered name')
    expect(message.content).toContain(
      'The only way for the model to see a business tool return value is return inspect(value)'
    )
    expect(parts.tools).not.toContain('ExitTarget')
    expect(parts.tools).not.toContain('PresentationDecision')
    expect(message.content).toContain('sends synchronously, and returns void; do not await it')
    expect(message.content).toContain('Sending a message does not finish the turn')
    expect(message.content).toContain('unfinished sibling operations')
  })

  it('documents synchronous button calls with explicit completion', async () => {
    const { parts } = await getNativeSystemMessage(props)

    expect(parts.tools.match(/buttons\(\s*input:/g)).toHaveLength(1)
    expect(parts.tools).toContain('label: string')
    expect(parts.tools).toMatch(/buttons\(\s*input:\s*Array<\{/)
    expect(parts.tools).toContain('chat.buttons([{"action":"say","label":"Track my order"}]);')
    expect(parts.tools).toContain('return exit("listen");')
    expect(parts.tools).not.toContain('chat.present')
    expect(parts.tools).not.toContain('chat.send')
    expect(parts.tools).not.toContain('await chat.')
    expect(parts.tools).not.toContain('return chat.')
    expect(parts.tools).not.toContain('Example message props/body:')
  })

  it('derives shortcut props from the registered button schema', async () => {
    const button = new Component({
      name: 'Choice',
      aliases: ['Button'],
      description: 'A custom choice.',
      props: z.object({ label: z.string(), choiceId: z.number() }),
    })
    const { parts } = await getNativeSystemMessage({ ...props, components: [button] })
    const withoutButtons = await getNativeSystemMessage({ ...props, components: [], isChatEnabled: true })

    expect(parts.tools).toContain('Component "Choice"')
    expect(parts.tools).toContain('choiceId: number')
    expect(parts.tools).toMatch(/buttons\(\s*input:\s*Array<\{/)
    expect(parts.tools).not.toContain('type ButtonProps =')
    expect(withoutButtons.parts.tools).not.toMatch(/buttons\(\s*input:/)
  })

  it('documents component, exit, and business schemas as TypeScript with nested optional inputs', async () => {
    const preferences = new Component({
      name: 'Preferences',
      description: 'Account display preferences.',
      props: z.object({
        profile: z.object({
          name: z.string(),
          layout: z.enum(['compact', 'expanded']).default('compact'),
          theme: z.nativeEnum({ Light: 'light', Dark: 'dark' } as const).default('light'),
          note: z.string().optional(),
        }),
      }),
    })
    const saved = new Exit({
      name: 'saved',
      description: 'Account preferences saved.',
      schema: z.object({ receipt: z.object({ id: z.string(), revision: z.number().int().optional() }) }),
    })
    const loadProfile = new Tool({
      name: 'loadProfile',
      input: z.object({ accountId: z.string() }),
      output: z.object({ displayName: z.string() }),
      handler: async () => ({ displayName: 'Ada' }),
    })
    const directory = new ObjectInstance({
      name: 'directory',
      tools: [
        new Tool({
          name: 'search',
          input: z.object({ query: z.string() }),
          output: z.array(z.object({ accountId: z.string() })),
          handler: async () => [],
        }),
      ],
    })
    const components = [...Object.values(DefaultComponents), preferences]
    const { parts } = await getNativeSystemMessage({
      ...props,
      components,
      exits: [listen, saved],
      globalTools: [loadProfile],
      objects: [directory],
    })
    const declarations = [...parts.tools.matchAll(/```typescript\n([\s\S]*?)\n```/g)]
      .map((match) => match[1])
      .join('\n')

    for (const method of ['buttons', 'image', 'file', 'video', 'audio', 'card', 'carousel', 'preferences']) {
      expect(declarations).toMatch(new RegExp(`${method}\\(\\s*input:`))
    }

    expect(declarations).not.toMatch(/message\(\s*input:/)
    expect(declarations).toMatch(/preferences\(\s*input:\s*\{\s*profile:\s*\{/)
    expect(declarations).toMatch(/layout\?:\s*['"]compact['"]\s*\|\s*['"]expanded['"]/)
    expect(declarations).toMatch(/theme\?:\s*['"]light['"]\s*\|\s*['"]dark['"]/)
    expect(declarations).toContain('note?: string')
    expect(declarations).toMatch(/carousel\(\s*input:\s*\{[\s\S]*?cards:\s*Array<\{/)
    expect(declarations).toMatch(/card\(\s*input:\s*\{[\s\S]*?text\?: string[\s\S]*?\): void/)
    expect(declarations).toMatch(/action\?:\s*['"]say['"]\s*\|\s*['"]url['"]\s*\|\s*['"]postback['"]/)
    expect(declarations).toMatch(/declare function exit\(\s*name: ['"]saved['"],\s*payload:\s*\{\s*receipt:\s*\{/)
    expect(declarations).toContain('revision?: number')
    expect(declarations).toContain('declare function loadProfile(')
    expect(declarations).toContain('accountId: string')
    expect(declarations).toContain('displayName: string')
    expect(declarations).toContain('namespace directory')
    expect(declarations).toContain('function search(')
    expect(declarations).toContain('query: string')

    expect(parts.tools).not.toMatch(/"(?:\$schema|\$ref|properties|required|additionalProperties|items|enum)"\s*:/)
    expect(parts.tools).not.toMatch(/"type"\s*:\s*"(?:object|array|string|number|integer|boolean|null)"/)
    expect(parts.tools).not.toContain('Props schema:')
    expect(parts.tools).not.toContain('Payload schema:')
  })

  it('documents no-payload exits without implying they can carry a response', async () => {
    const pause = new Exit({ name: 'pause', description: 'Pause this workflow.' })
    const done = new Exit({ name: 'done', description: 'Finish a count.', schema: z.number() })
    const { parts } = await getNativeSystemMessage({ ...props, exits: [listen, pause, done] })

    expect(parts.tools).toMatch(/declare function exit\(name: ['"]listen['"]\): never/)
    expect(parts.tools).toMatch(/declare function exit\(name: ['"]pause['"]\): never/)
    expect(parts.tools).toMatch(/declare function exit\(name: ['"]done['"], payload: number\): never/)
    expect(parts.tools).toContain('exit("listen"): Wait for the user. No payload. This does not send a message.')
    expect(parts.tools).not.toContain('exit("listen", payload)')
    expect(parts.tools).not.toContain('exit("pause", payload)')
    expect(parts.tools).not.toContain('exit(name: string, payload?: unknown)')
  })

  it('keeps object property state and schemas out of the callable API section', async () => {
    const account = new ObjectInstance({
      name: 'account',
      properties: [
        { name: 'secretBalance', value: 4317, type: z.number(), writable: false },
        { name: 'preferredLocale', value: 'fr-CA', type: z.enum(['en', 'fr-CA']), writable: true },
      ],
      tools: [new Tool({ name: 'refresh', description: 'Refresh account data', handler: async () => undefined })],
    })
    const { message, parts } = await getNativeSystemMessage({ ...props, objects: [account] })
    expect(parts.tools).toContain('namespace account')
    expect(parts.tools).toContain('refresh')

    for (const forbidden of ['secretBalance', 'preferredLocale', '4317', 'fr-CA']) {
      expect(message.content).not.toContain(forbidden)
    }

    expect(message.content).toContain('read/write rules are listed in Memory')
  })

  it('renders native examples from their structured definitions without legacy markers or invented results', () => {
    const examples = [
      new Example({ situation: 'The user asks for a plan', code: 'return await readAccount()' }),
      new Example({
        situation: 'Offer a choice',
        text: 'Choose a plan.',
        messages: [{ component: DefaultComponents.Button, props: { label: 'Pro' } }],
        exit: listen,
      }),
    ]
    const output = renderNativeExamples(examples, props.components, props.exits)
    expect(output).toContain('not live conversation')
    expect(output).toContain('run_javascript')
    expect(output).toContain('chat.buttons')
    expect(output).not.toContain('show_button')
    expect(output).not.toContain('"name":"listen"')
    expect(output).not.toContain('■')
    expect(output).not.toContain('tool_result')
  })

  it('demonstrates natural completion for text-only answers', () => {
    const example = new Example({
      situation: 'Greeting',
      text: 'Hello!',
      exit: listen,
    })
    const output = renderNativeExamples([example], props.components, props.exits)
    expect(output).toContain('{"text":"Hello!"}')
    expect(output).not.toContain('toolCalls')
  })

  it('combines presentation and business code into one native call', () => {
    const example = new Example({
      situation: 'Show an action before inspecting data',
      messages: [{ component: 'button', props: { label: 'Click' } }],
      code: 'return 1',
    })
    const output = renderNativeExamples([example], props.components, props.exits)

    expect(output.match(/"name":"run_javascript"/g)).toHaveLength(1)
    expect(output).toContain('chat.buttons')
    expect(output).not.toContain('await chat.')
    expect(output).toContain('return inspect(await (1))')
    expect(output).not.toContain('return 1')
  })

  it('normalizes plain example returns while retaining declarations, effects, and nested function returns', () => {
    const example = new Example({
      situation: 'Inspect a lookup or record its absence',
      code: [
        'const value = await readAccount()',
        'function label() { return "Account" }',
        'if (value) return value',
        'await recordMissing()',
      ].join('\n'),
    })
    const rendered = renderNativeExamples([example], [], [])
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string

    expect(code).toContain('const value = await readAccount()')
    expect(code).toContain('function label() { return "Account" }')
    expect(code).toContain('if (value) return inspect(await (value));')
    expect(code).toContain('await recordMissing()')
    expect(code.trimEnd()).toMatch(/return inspect\(undefined\);?$/)
    expect(code).not.toContain('return value')
  })

  it.each(['return exit("listen")', 'return await exit("listen")', 'exit()'])(
    'keeps named example completion explicit without adding unreachable returns: %s',
    (code) => {
      const example = new Example({ situation: 'Wait for a reply', code, exit: listen })
      const rendered = renderNativeExamples([example], props.components, props.exits)
      const response = JSON.parse(rendered.split('\n').at(-1)!)
      const program = response.toolCalls[0].arguments.code as string

      expect(program).toMatch(/^return exit\("listen"\);?$/)
    }
  )

  it('rejects unavailable capabilities in configured worker examples', async () => {
    const delivery = new Example({
      situation: 'Show a choice',
      messages: [{ component: 'Button', props: { label: 'Continue' } }],
    })
    const completion = new Example({ situation: 'Finish', code: 'return exit("listen")' })

    await expect(getNativeSystemMessage({ ...props, isChatEnabled: false, examples: [delivery] })).rejects.toThrow(
      'Worker examples cannot contain user-facing messages.'
    )
    await expect(
      getNativeSystemMessage({ ...props, isChatEnabled: false, exits: [], examples: [completion] })
    ).rejects.toThrow('An example cannot call an exit when none is registered.')
  })

  it('rejects examples that try to send ordinary text as a rich component', () => {
    const example = new Example({
      situation: 'Present a reminder',
      messages: [{ component: 'Message', props: { text: 'Choose when ready.' } }],
      exit: listen,
    })
    expect(() => renderNativeExamples([example], props.components, props.exits)).toThrow(
      'Unknown native example component: Message'
    )
  })

  it('keeps ordinary text separate while rich content uses only component props', () => {
    const example = new Example({
      situation: 'Present a plan and its image',
      text: 'Here is the plan.',
      messages: [
        { component: 'Card', props: { title: 'Standard', text: 'Five projects included.' } },
        { component: 'Image', props: { url: 'https://example.com/standard.png' } },
      ],
      exit: listen,
    })
    const components = [DefaultComponents.Card, DefaultComponents.Image]
    const rendered = renderNativeExamples([example], components, props.exits)
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string

    expect(response.text).toBe('Here is the plan.')
    expect(code).toContain('chat.card({"title":"Standard","text":"Five projects included."});')
    expect(code).toContain('chat.image({"url":"https://example.com/standard.png"});')
    expect(code.indexOf('chat.card')).toBeLessThan(code.indexOf('chat.image'))
    expect(code.indexOf('chat.image')).toBeLessThan(code.indexOf('return exit('))
    expect(code).not.toContain('await chat.')
    expect(code).not.toContain('"component"')
    expect(code).not.toContain('"props"')
  })

  it('gives a native last-response reminder without encouraging execution followed by an exit', () => {
    const text = getNativeExecutionState({ ...props, iteration: { current: 3, limit: 3 } })
    expect(text).toContain('last response')
    expect(text).toContain('Do not request JavaScript results')
    expect(text).not.toContain('■')
    expect(text).not.toContain('omit return')
  })

  it.each([false, true])(
    'requires a registered worker exit in the final execution state (components=%s)',
    (hasComponents) => {
      const text = getNativeExecutionState({
        ...props,
        components: hasComponents ? props.components : [],
        isChatEnabled: false,
        iteration: { current: 3, limit: 3 },
      })

      expect(text).toContain('return exit("NAME", payload) using a registered name')
      expect(text).toContain('incomplete or error payload only when the exit schema permits it')
      expect(text).toContain('Assistant prose and inspection returns do not complete a worker')
      expect(text).not.toContain('chat.present')
    }
  )
})
