import { z } from '@bpinternal/zui'
import { describe, expect, it } from 'vitest'
import { DefaultComponents } from '../chat/component.default.js'
import { Component, createComponentRegistry } from '../chat/component.js'
import { resolveResponse } from '../chat/response.js'
import { Exit } from '../exit.js'
import { ObjectInstance } from '../objects.js'
import { Tool } from '../tool.js'
import { getNativeSystemMessage } from './native.js'

const listen = new Exit({ name: 'listen', description: 'Wait for the user.' })
const props = {
  instructions: 'Help with accounts.',
  isChatEnabled: true,
  components: createComponentRegistry([DefaultComponents.Buttons]),
  exits: [listen],
  globalTools: [],
  objects: [],
}

describe('native prompt', () => {
  it('separates final-answer text from actions and preserves requested literal content', async () => {
    const chat = await getNativeSystemMessage(props)
    const worker = await getNativeSystemMessage({ ...props, isChatEnabled: false })
    expect(chat.parts.protocol).toContain('write only the final user-facing answer, once')
    expect(chat.message.content).toContain(
      'still call required tools, send requested components, and provide requested progress updates'
    )
    expect(chat.message.content).toContain('Preserve literal text or code the user explicitly asks you to reproduce')
    expect(worker.message.content).not.toContain('# Assistant text delivery')
    expect(worker.message.content).toContain('Keep assistant text empty')
  })

  it('separates fictional examples from the actual API and task instructions', async () => {
    const tool = new Tool({
      name: 'readAccount',
      description: 'Read an account',
      input: z.object({ id: z.string() }),
      output: z.string(),
      handler: async () => 'Pro',
    })
    const { message, parts } = await getNativeSystemMessage({ ...props, globalTools: [tool] })

    expect(message.role).toBe('system')
    expect(message.content).toContain('# run_javascript syntax')
    expect(message.content).toContain('Make at most one run_javascript call per response')
    expect(message.content).toContain('exactly one property: "code"')
    expect(message.content).toContain('readAccount')
    expect(message.content).toContain('$iterations')
    expect(message.content).not.toContain('■')
    expect(message.content).toContain('<examples>')
    expect(message.content).toContain('NOT live conversation, task history, or evidence')
    expect(parts.tools).not.toContain('exampleSearch')
    expect(parts.protocol).toContain('exampleSearch')
    const content = String(message.content)
    expect(content.indexOf('</examples>')).toBeLessThan(content.indexOf('# JavaScript API'))
    expect(content.indexOf('# JavaScript API')).toBeLessThan(content.indexOf('# Task instructions'))
    expect(Object.keys(parts)).toEqual(['instructions', 'tools', 'protocol'])
  })

  it('supports plain chat with no rich components', async () => {
    const { message } = await getNativeSystemMessage({
      ...props,
      components: createComponentRegistry([]),
      isChatEnabled: true,
    })

    expect(message.content).toContain('normal assistant text')
    expect(message.content).not.toContain('chat.')
    expect(message.content).not.toContain('declare const chat:')
  })

  it.each([
    { chat: true, hasExits: true },
    { chat: true, hasExits: false },
    { chat: false, hasExits: true },
    { chat: false, hasExits: false },
  ])('documents only available capabilities (chat=$chat, exits=$hasExits)', async ({ chat, hasExits }) => {
    const available = {
      ...props,
      components: createComponentRegistry(Object.values(DefaultComponents)),
      exits: hasExits ? [listen] : [],
      isChatEnabled: chat,
    }
    const { message } = await getNativeSystemMessage(available)
    const text = String(message.content)

    expect(text).toContain('Every run_javascript program must explicitly return inspect(value)')
    expect(text).not.toMatch(/\bexit\s*\(\s*\)/)
    expect(text).not.toMatch(/return is omitted|omit return|plain JavaScript return/i)

    if (hasExits) {
      expect(text).toMatch(/declare function exit\(name: ['"]listen['"]\)/)
    } else {
      expect(text).not.toMatch(/\bexits?\b/i)
    }

    if (chat) {
      expect(text).toContain('declare const chat:')
      expect(text).not.toContain('Keep assistant text empty:')
    } else {
      expect(text).not.toMatch(/\bchat\b|# Assistant response/)
      expect(text).toContain('Respond only with a run_javascript tool call')
      expect(text).toContain('Keep assistant text empty:')
      expect(text).toContain('during recovery, and when completing the task')
    }
  })

  it('requires returned inspection decisions and awaited business operations', async () => {
    const { message } = await getNativeSystemMessage(props)

    expect(message.content).toContain(
      'The only way for the model to see a business tool return value is return inspect(value)'
    )
    expect(message.content).toContain('takes effect only when returned')
    expect(message.content).toContain('Await all business operations before the final return')
    expect(message.content).toContain('including unfinished siblings after a Promise.all failure')
    expect(message.content).toContain('waits for the stream, code, and queued message deliveries')
  })

  it('keeps memory and recovery guarantees concise and explicit', async () => {
    const { parts } = await getNativeSystemMessage({ ...props, isChatEnabled: false })

    expect(parts.protocol).toContain('Declare retained variables at top level with const or let')
    expect(parts.protocol).toContain('Named variables survive transcript compaction')
    expect(parts.protocol).toContain('nested edits are forbidden')
    expect(parts.protocol).toContain('newest first: [0] is the last settled iteration')
    expect(parts.protocol).toContain('retry only failed work')
    expect(parts.protocol).toContain('repair its cause when safe and authorized')
    expect(parts.protocol).toContain('Unchanged retries do not establish that recovery is exhausted')
    expect(parts.protocol).toContain('return inspect({ errors, completed }) or let the error reach the runtime')
    expect(parts.protocol).toContain('Honor task instructions defining terminal failure outcomes')
    expect(parts.protocol).toContain('recovery is unavailable, unsafe, forbidden, its budget is exhausted')
    expect(parts.protocol).toContain('tool-attempt limits separately from the model-response budget')
  })

  it('requires a matching task exit even when chat explains the outcome', async () => {
    const cancelled = new Exit({
      name: 'purchaseAbandoned',
      description: 'When payment fails and the purchase must be cancelled.',
      schema: z.object({ reason: z.string() }),
    })
    const typedChat = await getNativeSystemMessage({ ...props, exits: [listen, cancelled] })
    const ordinaryChat = await getNativeSystemMessage(props)
    const worker = await getNativeSystemMessage({ ...props, isChatEnabled: false })

    expect(typedChat.parts.protocol).toContain('When a known outcome matches a registered task exit description')
    expect(typedChat.parts.protocol).toContain('Prose does not select a typed exit')
    expect(typedChat.parts.protocol).toContain('Use return exit("listen") only when waiting for the user')
    expect(typedChat.parts.tools).toContain('purchaseAbandoned')
    expect(ordinaryChat.parts.protocol).not.toContain('Prose does not select a typed exit')
    expect(ordinaryChat.parts.protocol).toContain('A completed response without tool calls finishes the turn')
    expect(worker.parts.protocol).toContain('Assistant prose alone does not complete a worker task')
  })

  it.each(['markdown', 'text', 'speech'] as const)(
    'documents the %s response separately from components',
    async (preset) => {
      const response = resolveResponse(preset)
      const { message, parts } = await getNativeSystemMessage({ ...props, response })

      expect(parts.protocol).toContain('# Assistant response')
      expect(parts.protocol).toContain(response.instructions)
      expect(parts.tools).not.toContain(response.instructions)
      expect(message.content).not.toMatch(/chat\.(text|message|markdown|speech)\(/)
    }
  )

  it('renders custom response guidance without callbacks or worker leakage', async () => {
    const response = resolveResponse({
      instructions: 'CUSTOM_RESPONSE_INSTRUCTIONS',
      handler: function privateDeliveryImplementation() {},
      onDelta: function privateStreamingImplementation() {},
    })
    const chat = await getNativeSystemMessage({ ...props, response, isChatEnabled: true })
    const worker = await getNativeSystemMessage({ ...props, response, isChatEnabled: false })

    expect(chat.message.content).toContain('CUSTOM_RESPONSE_INSTRUCTIONS')
    expect(chat.message.content).not.toContain('Write natural Markdown')
    expect(chat.message.content).not.toContain('privateDeliveryImplementation')
    expect(chat.message.content).not.toContain('privateStreamingImplementation')
    expect(worker.message.content).not.toContain('# Assistant response')
    expect(worker.message.content).not.toContain('CUSTOM_RESPONSE_')
  })

  it('documents buttons as one synchronous array component', async () => {
    const { message, parts } = await getNativeSystemMessage(props)

    expect(parts.tools).toMatch(/buttons\(\s*props:\s*Array<\{/)
    expect(parts.tools).toContain('label: string')
    expect(parts.tools).not.toMatch(/\bbutton\(/)
    expect(message.content).toContain('sends synchronously, and returns void; do not await it')
    expect(message.content).toContain('A component call does not finish the program')
  })

  it('documents component, exit, and business schemas as TypeScript with nested optional inputs', async () => {
    const preferences = new Component({
      name: 'preferences',
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
      components: createComponentRegistry(components),
      exits: [listen, saved],
      globalTools: [loadProfile],
      objects: [directory],
    })
    const declarations = [...parts.tools.matchAll(/```typescript\n([\s\S]*?)\n```/g)]
      .map((match) => match[1])
      .join('\n')

    for (const method of ['buttons', 'image', 'file', 'video', 'audio', 'card', 'carousel', 'preferences']) {
      expect(declarations).toMatch(new RegExp(`${method}\\(\\s*props:`))
    }

    expect(declarations).not.toMatch(/message\(\s*props:/)
    expect(declarations).toMatch(/preferences\(\s*props:\s*\{\s*profile:\s*\{/)
    expect(declarations).toMatch(/layout\?:\s*['"]compact['"]\s*\|\s*['"]expanded['"]/)
    expect(declarations).toMatch(/theme\?:\s*['"]light['"]\s*\|\s*['"]dark['"]/)
    expect(declarations).toContain('note?: string')
    expect(declarations).toMatch(/carousel\(\s*props:\s*\{[\s\S]*?cards:\s*Array<\{/)
    expect(declarations).toMatch(/card\(\s*props:\s*\{[\s\S]*?text\?: string[\s\S]*?\): void/)
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
    expect(parts.tools).toContain('Wait for the user. This does not send a message.')
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
})
