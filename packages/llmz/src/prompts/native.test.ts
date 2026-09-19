import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { Example } from '../example.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { TranscriptArray } from '../transcript.js'
import { getNativeExecutionState, getNativeSystemMessage, renderNativeExamples } from './native.js'

const listen = new Exit({ name: 'listen', description: 'Wait for the user.' })
const props = {
  instructions: 'Help with accounts.',
  transcript: new TranscriptArray([{ role: 'user', content: 'LIVE USER INPUT' }]),
  components: [DefaultComponents.Text, DefaultComponents.Button],
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
    expect(worker.message.content).toContain('prose alone does not complete')
  })

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
    expect(parts.protocol).toContain('let the error reach the runtime, instead of choosing a failure exit in catch')
    expect(parts.protocol).toContain('recovery is unavailable, unsafe, forbidden')
    expect(parts.protocol).toContain('attempt or response budget is exhausted')
    expect(parts.protocol).toContain('Honor task instructions defining terminal failure outcomes')
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
    expect(typedChat.parts.protocol).toContain('Use listen only when waiting for the user')
    expect(typedChat.parts.protocol).not.toContain('purchaseAbandoned')
    expect(typedChat.parts.tools).toContain('exit("purchaseAbandoned", payload)')
    expect(ordinaryChat.parts.protocol).not.toContain('An apology or other prose does not select a typed exit')
    expect(ordinaryChat.parts.protocol).toContain('A completed response without tool calls finishes the turn')
  })

  it('keeps speech delivery guidance on ordinary assistant output', async () => {
    const { message } = await getNativeSystemMessage({ ...props, components: [DefaultComponents.Speech] })
    expect(message.content).toContain('Assistant text delivery: Plain conversational prose')
    expect(message.content).toContain('spell out numbers')
    expect(message.content).not.toContain('show_speech')
  })

  it.each([DefaultComponents.Text, DefaultComponents.Speech])(
    'demonstrates ordinary assistant content for $definition.name',
    async (component) => {
      const { parts } = await getNativeSystemMessage({ ...props, components: [component] })
      const firstExample = component.definition.generation!.examples![0]!

      if (Array.isArray(firstExample)) {
        throw new Error('Expected one text message in the first example.')
      }

      expect(parts.tools).toContain('ordinary assistant content, without a tool call')
      expect(parts.tools).toContain(`Assistant text example 1:\n${firstExample.body}`)
      expect(parts.tools).not.toContain('return chat.present(')
      expect(parts.tools).not.toContain('Presentation examples (complete messages)')
    }
  )

  it('documents runtime decisions and presentation schemas in the JavaScript section', async () => {
    const done = new Exit({ name: 'done', description: 'Complete a count', schema: z.number().int() })
    const { message, parts } = await getNativeSystemMessage({ ...props, exits: [listen, done] })

    expect(parts.tools).toContain('declare function inspect<T>')
    expect(parts.tools).toContain('declare function exit()')
    expect(parts.tools).toContain('exit("done", payload)')
    expect(parts.tools).toContain('"type":"integer"')
    expect(parts.tools).toContain('Component "Button"')
    expect(parts.tools).toContain('"label"')
    expect(message.content).toContain('take effect only when returned')
    expect(message.content).toContain('Always prefer return exit(...)')
    expect(message.content).toContain('also stops JavaScript if return is omitted')
    expect(parts.tools).toContain('exit?: ExitTarget')
    expect(parts.tools).toContain('{ name: \"done\"; payload: number }')
    expect(message.content).toContain('unfinished sibling operations')
  })

  it('distinguishes direct button props from complete presentation messages', async () => {
    const { parts } = await getNativeSystemMessage(props)

    expect(parts.tools).toContain('type ButtonProps =')
    expect(parts.tools).toContain('label: string')
    expect(parts.tools).toContain('buttons(buttons: ButtonProps[])')
    expect(parts.tools).toContain('chat.buttons([{ action: "say", label: "Track my order" }')
    expect(parts.tools).toContain('without a component or props wrapper')
    expect(parts.tools).toContain(
      'return chat.present({"messages":[{"component":"Button","props":{"action":"say","label":"Track my order"}}]});'
    )
    expect(parts.tools).not.toContain('Example message props/body:')
  })

  it('derives shortcut props from the registered button schema', async () => {
    const button = new Component({
      name: 'Choice',
      aliases: ['Button'],
      description: 'A custom choice.',
      type: 'leaf',
      leaf: { props: z.object({ label: z.string(), choiceId: z.number() }) },
    })
    const { parts } = await getNativeSystemMessage({ ...props, components: [button] })
    const withoutButtons = await getNativeSystemMessage({ ...props, components: [DefaultComponents.Text] })

    expect(parts.tools).toContain('type ButtonProps =')
    expect(parts.tools).toContain('choiceId: number')
    expect(parts.tools).toContain('buttons(buttons: ButtonProps[])')
    expect(withoutButtons.parts.tools).not.toContain('buttons(buttons:')
  })

  it('documents no-payload exits without implying they can carry a response', async () => {
    const pause = new Exit({ name: 'pause', description: 'Pause this workflow.' })
    const done = new Exit({ name: 'done', description: 'Finish a count.', schema: z.number() })
    const { parts } = await getNativeSystemMessage({ ...props, exits: [listen, pause, done] })

    expect(parts.tools).toContain('declare function exit(name: "listen"): never;')
    expect(parts.tools).toContain('declare function exit(name: "pause"): never;')
    expect(parts.tools).toContain('declare function exit(name: "done", payload: number): never;')
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
        messages: [
          { component: 'message', body: 'Choose a plan.' },
          { component: DefaultComponents.Button, props: { label: 'Pro' } },
        ],
        exit: listen,
      }),
    ]
    const output = renderNativeExamples(examples, props.components, props.exits)
    expect(output).toContain('not live conversation')
    expect(output).toContain('run_javascript')
    expect(output).toContain('chat.present')
    expect(output).not.toContain('show_button')
    expect(output).not.toContain('"name":"listen"')
    expect(output).not.toContain('■')
    expect(output).not.toContain('tool_result')
  })

  it('demonstrates natural completion for text-only answers', () => {
    const example = new Example({
      situation: 'Greeting',
      messages: [{ component: 'message', body: 'Hello!' }],
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
    expect(output).toContain('await chat.send')
    expect(output).toContain('return 1')
  })

  it('preserves message order when text follows a rich component', () => {
    const example = new Example({
      situation: 'Present choices before the reminder',
      messages: [
        { component: 'Button', props: { label: 'Continue' } },
        { component: 'Message', body: 'Choose when ready.' },
      ],
      exit: listen,
    })
    const rendered = renderNativeExamples([example], props.components, props.exits)
    const response = JSON.parse(rendered.split('\n').at(-1)!)
    const code = response.toolCalls[0].arguments.code as string

    expect(response.text).toBeUndefined()
    expect(code.indexOf('Button')).toBeLessThan(code.indexOf('Message'))
    expect(code).toContain('return chat.present')
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

      expect(text).toContain('returning exit(name, payload) from run_javascript with a registered exit')
      expect(text).toContain('incomplete or error payload only when the exit schema permits it')
      expect(text).toContain('Assistant prose and inspection returns do not complete a worker')
      expect(text).not.toContain('chat.present')
    }
  )
})
