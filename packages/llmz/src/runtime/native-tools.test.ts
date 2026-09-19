import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { Exit } from '../exit.js'
import {
  createNativeToolCatalogue,
  getNativeChatMethods,
  renderNativeChatInput,
  transcriptToNativeMessages,
  validateNativePresentationInputs,
  validateNativePresentations,
  validateNativeToolCalls,
} from './native-tools.js'

const listen = new Exit({ name: 'listen', description: 'Wait for the next user turn.' })
const done = new Exit({ name: 'done', description: 'Complete', schema: z.object({ count: z.number().int().min(0) }) })
const components = Object.values(DefaultComponents)
const catalogue = createNativeToolCatalogue({ components, exits: [listen, done] })
const call = (name: string, input: Record<string, unknown> = {}, id = name) => ({ id, name, input })

describe('single native execution tool', () => {
  it('exposes only JavaScript even when components and typed exits are available', () => {
    expect(catalogue.tools.map((tool) => tool.name)).toEqual(['run_javascript'])
    expect(catalogue.tools[0]?.parameters).toMatchObject({
      type: 'object',
      required: ['code'],
      additionalProperties: false,
    })
    expect(JSON.stringify(catalogue.tools)).not.toContain('■')
  })

  it('rejects ambiguous component and exit names before generation', () => {
    expect(() =>
      createNativeToolCatalogue({
        components: [],
        exits: [done, new Exit({ name: 'DONE', description: 'Other' })],
      })
    ).toThrow(/Duplicate exit name/)

    const duplicate = new Component({
      name: 'Other',
      aliases: ['btn'],
      description: 'Colliding alias',
      props: z.object({}),
    })

    expect(() => createNativeToolCatalogue({ components: [DefaultComponents.Button, duplicate], exits: [] })).toThrow(
      /Duplicate component name or alias/
    )
  })

  it('accepts an ordinary text response or one complete JavaScript program', () => {
    expect(validateNativeToolCalls([], catalogue)).toEqual({ valid: true, errors: [], calls: [] })

    const result = validateNativeToolCalls([call('run_javascript', { code: 'return inspect(42)' })], catalogue)

    expect(result.valid).toBe(true)
    expect(result.calls).toMatchObject([{ kind: 'javascript', code: 'return inspect(42)' }])
  })

  it.each([
    [call('run_javascript', { code: 'return 1' }, 'a'), call('run_javascript', { code: 'return 2' }, 'b')],
    [call('run_javascript', { code: 'return 1' }, 'same'), call('run_javascript', { code: 'return 2' }, 'same')],
    [call('run_javascript', { code: 'return 1' }, '')],
    [call('run_javascript', { code: '   ' })],
    [call('run_javascript', { code: 'return 1', ignored: true })],
    [call('listen')],
    [call('exit_done', { count: 2 })],
    [call('show_button', { label: 'First' })],
  ])('rejects the entire invalid native batch before dispatch: %j', (...calls) => {
    const result = validateNativeToolCalls(calls, catalogue)

    expect(result.valid).toBe(false)
    expect(result.calls).toEqual([])
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('component chat methods', () => {
  it('exposes every registered component with a normalized method name', () => {
    const preview = new Component({
      name: 'URLPreview',
      description: 'Preview a link.',
      props: z.object({ url: z.string() }),
    })
    const methods = getNativeChatMethods([...components, preview])

    expect(methods.map((method) => method.name)).toEqual([
      'buttons',
      'image',
      'file',
      'video',
      'audio',
      'card',
      'carousel',
      'urlPreview',
    ])
    expect(methods.at(-1)?.component).toBe(preview)
    expect(getNativeChatMethods([])).toEqual([])
  })

  it('maps a Button alias to an array method and preserves defaults and display order', () => {
    const choice = new Component({ ...DefaultComponents.Button.definition, name: 'Choice', aliases: ['Button'] })
    const [method] = getNativeChatMethods([choice])
    const rendered = renderNativeChatInput(method!, [{ label: 'First' }, { label: 'Second', action: 'postback' }])

    expect(method).toMatchObject({ name: 'buttons', component: choice, multiple: true })
    expect(rendered).toEqual([
      { type: 'component', name: 'Choice', props: { action: 'say', label: 'First' } },
      { type: 'component', name: 'Choice', props: { action: 'postback', label: 'Second' } },
    ])
    expect(() => renderNativeChatInput(method!, { label: 'Not an array' })).toThrow()
    expect(() => renderNativeChatInput(method!, [])).toThrow()
  })

  it('keeps a card’s text and optional content in props', () => {
    const [method] = getNativeChatMethods([DefaultComponents.Card])
    const [card] = renderNativeChatInput(method!, { title: 'Standard', text: 'Five projects.' })
    const [minimal] = renderNativeChatInput(method!, { title: 'Reminder' })

    expect(card).toEqual({ type: 'component', name: 'Card', props: { title: 'Standard', text: 'Five projects.' } })
    expect(minimal).toEqual({ type: 'component', name: 'Card', props: { title: 'Reminder' } })
    expect(() => renderNativeChatInput(method!, { title: 'Standard', body: 'Old body' })).toThrow()
  })

  it('rejects an invalid batch before invoking any component handler', () => {
    const handler = vi.fn()
    const action = DefaultComponents.Button.withHandler(handler)
    const [method] = getNativeChatMethods([action])

    expect(() => renderNativeChatInput(method!, [{ label: 'Valid' }, { label: 42 }])).toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  it('applies schema transformations exactly once before producing delivery props', () => {
    const transform = vi.fn((label: string) => `Choice: ${label}`)
    const choice = new Component({
      name: 'Choice',
      aliases: ['Button'],
      description: 'A transformed choice.',
      props: z.object({ label: z.string().transform(transform) }),
    })
    const [method] = getNativeChatMethods([choice])
    const rendered = renderNativeChatInput(method!, [{ label: 'First' }, { label: 'Second' }])

    expect(rendered.map((message) => message.props.label)).toEqual(['Choice: First', 'Choice: Second'])
    expect(transform).toHaveBeenCalledTimes(2)
  })

  it('rejects derived method-name collisions before generation', () => {
    const buttons = new Component({ name: 'Buttons', description: 'Conflicting buttons.', props: z.object({}) })

    expect(() => createNativeToolCatalogue({ components: [DefaultComponents.Button, buttons], exits: [] })).toThrow(
      /duplicate chat method: buttons/
    )

    const first = new Component({ name: 'URLPreview', description: 'A preview.', props: z.object({}) })
    const second = new Component({ name: 'URL-preview', description: 'Another preview.', props: z.object({}) })

    expect(() => getNativeChatMethods([first, second])).toThrow(/duplicate chat method: urlPreview/)
  })

  it('treats a custom property named body as ordinary schema data', () => {
    const document = new Component({
      name: 'Document',
      description: 'A document payload.',
      props: z.object({ body: z.number() }),
    })
    const [method] = getNativeChatMethods([document])

    expect(renderNativeChatInput(method!, { body: 7 })).toEqual([
      { type: 'component', name: 'Document', props: { body: 7 } },
    ])
  })

  it('derives the input schema directly from flat props', () => {
    const [method] = getNativeChatMethods([DefaultComponents.Card])

    expect(method?.schema).toBe(DefaultComponents.Card.definition.props)
    expect(DefaultComponents.Card.definition.props.shape).toHaveProperty('text')
    expect(DefaultComponents.Card.definition.props.shape).toHaveProperty('image')
    expect(DefaultComponents.Card.definition.props.shape).toHaveProperty('buttons')
    expect(DefaultComponents.Card.definition.props.shape).not.toHaveProperty('children')
    expect(DefaultComponents.Card.definition.props.shape).not.toHaveProperty('body')
  })
})

describe('JavaScript presentations', () => {
  it('resolves aliases and validates defaults while preserving display order', () => {
    const messages = validateNativePresentations(
      [
        { component: 'bTn', props: { label: 'First' } },
        { component: 'Button', props: { label: 'Second' } },
      ],
      components
    )

    expect(messages).toEqual([
      { type: 'component', name: 'Button', props: { action: 'say', label: 'First' } },
      { type: 'component', name: 'Button', props: { action: 'say', label: 'Second' } },
    ])
  })

  it.each([
    [],
    [{ component: 'Missing', props: {} }],
    [{ component: 'Image' }],
    [{ component: 'Image', props: { url: 42 } }],
    [{ component: 'Image', props: { url: 'https://example.com/image.png' }, body: 'Unexpected body' }],
    [{ component: 'Card', props: { title: 'Title', text: 42 } }],
    [{ component: 'Card', props: { title: 'Title' }, children: ['Old body'] }],
    [{ component: 'Carousel', props: { cards: [] } }],
  ])('rejects invalid presentation data before delivery: %j', (...messages) => {
    expect(() => validateNativePresentations(messages, components)).toThrow()
  })

  it('validates all messages without invoking handlers', () => {
    const handler = vi.fn()
    const button = DefaultComponents.Button.withHandler(handler)

    expect(() =>
      validateNativePresentations(
        [
          { component: 'Button', props: { label: 'Valid' } },
          { component: 'Image', props: { url: 42 } },
        ],
        [button, DefaultComponents.Image]
      )
    ).toThrow()
    expect(handler).not.toHaveBeenCalled()
  })

  it('renders carousel card data without child components', () => {
    const [rendered] = validateNativePresentations(
      [
        {
          component: 'Carousel',
          props: { cards: [{ title: 'Plan', text: 'Details', buttons: [{ label: 'Choose' }] }] },
        },
      ],
      components
    )

    expect(rendered).toEqual({
      type: 'component',
      name: 'Carousel',
      props: { cards: [{ title: 'Plan', text: 'Details', buttons: [{ action: 'say', label: 'Choose' }] }] },
    })
  })

  it('parses presentation schemas once and preserves parsed props', () => {
    const transform = vi.fn((count: number) => count + 1)
    const custom = new Component({
      name: 'Counter',
      description: 'A counter.',
      props: z.object({ count: z.number().transform(transform) }),
    })
    const [message] = validateNativePresentations([{ component: 'Counter', props: { count: 1 } }], [custom])

    expect(message).toEqual({ type: 'component', name: 'Counter', props: { count: 2 } })
    expect(transform).toHaveBeenCalledTimes(1)
  })

  it('validates ordinary props without adding a separate body', () => {
    const custom = new Component({ name: 'Custom', description: 'Custom', props: z.object({ body: z.number() }) })
    const [message] = validateNativePresentationInputs([{ component: 'Custom', props: { body: 7 } }], [custom])

    expect(message).toEqual({ component: 'Custom', props: { body: 7 } })
  })
})
describe('native transcript messages', () => {
  it('retains native roles and media on their original turns', () => {
    const messages = transcriptToNativeMessages([
      {
        role: 'user',
        content: 'First photo',
        attachments: [{ type: 'image', url: 'https://example.com/first.png', id: 'first' }],
      },
      { role: 'assistant', content: 'I see the photo.' },
      { role: 'user', content: '', attachments: [{ type: 'audio', url: 'https://example.com/voice.wav' }] },
    ])
    expect(messages.map((message) => message.role)).toEqual(['user', 'assistant', 'user'])
    expect(messages[0]).toMatchObject({
      type: 'multipart',
      content: expect.arrayContaining([{ type: 'image', url: 'https://example.com/first.png' }]),
    })
    expect(JSON.stringify(messages[2])).not.toContain('first.png')
    expect(messages[2]).toMatchObject({
      type: 'multipart',
      content: expect.arrayContaining([{ type: 'audio', url: 'https://example.com/voice.wav' }]),
    })
  })

  it('keeps events and summaries as labeled data rather than elevated instructions', () => {
    const messages = transcriptToNativeMessages([
      { role: 'event', name: 'payment', payload: { amount: 10 } },
      {
        role: 'summary',
        content: 'Previous request',
        attachments: [{ type: 'image', url: 'https://example.com/summary.png' }],
      },
      { role: 'user', content: 'A spoken request', modality: 'voice' },
    ])
    expect(messages.every((message) => message.role === 'user')).toBe(true)
    expect(messages[0]?.content).toContain('Event: payment')
    expect(JSON.stringify(messages[1])).toContain('Earlier conversation summary')
    expect(JSON.stringify(messages[1])).toContain('summary.png')
    expect(messages[2]?.content).toContain('[Voice message; transcribed]')
  })
})
