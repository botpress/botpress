import { z } from '@bpinternal/zui'
import { describe, expect, it, vi } from 'vitest'
import { DefaultComponents } from '../component.default.js'
import { Component } from '../component.js'
import { Exit } from '../exit.js'
import {
  createNativeToolCatalogue,
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
      type: 'leaf',
      name: 'Other',
      aliases: ['btn'],
      description: 'Colliding alias',
      leaf: { props: z.object({}) },
    })

    expect(() =>
      createNativeToolCatalogue({
        components: [DefaultComponents.Button, duplicate],
        exits: [],
      })
    ).toThrow(/Duplicate component name or alias/)
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

describe('JavaScript presentations', () => {
  it('resolves aliases and validates defaults while preserving display order', () => {
    const messages = validateNativePresentations(
      [
        { component: 'bTn', props: { label: 'First' } },
        { component: 'Button', props: { label: 'Second' } },
      ],
      components
    )

    expect(messages.map((message) => message.props)).toEqual([
      { action: 'say', label: 'First' },
      { action: 'say', label: 'Second' },
    ])
  })

  it.each([
    [],
    [{ component: 'Missing' }],
    [{ component: 'Image' }],
    [{ component: 'Image', props: { url: 42 } }],
    [{ component: 'Image', props: { url: 'https://example.com/image.png' }, body: 'Unexpected body' }],
    [{ component: 'Card', props: { title: 'Title' } }],
    [{ component: 'Card', props: { title: 'Title' }, body: 42 }],
    [{ component: 'Card', props: { title: 'Title' }, body: 'Body', extra: true }],
    [{ component: 'Carousel', props: { cards: [] } }],
  ])('rejects invalid presentation data before delivery: %j', (...messages) => {
    expect(() => validateNativePresentations(messages, components)).toThrow()
  })

  it('validates all messages before invoking the first renderer', () => {
    const render = vi.spyOn(DefaultComponents.Button, 'render')

    try {
      expect(() =>
        validateNativePresentations(
          [
            { component: 'Button', props: { label: 'Valid' } },
            { component: 'Image', props: { url: 42 } },
          ],
          components
        )
      ).toThrow()

      expect(render).not.toHaveBeenCalled()
    } finally {
      render.mockRestore()
    }
  })

  it('uses registered custom renderers, including nested carousel children', () => {
    const [rendered] = validateNativePresentations(
      [
        {
          component: 'Carousel',
          props: { cards: [{ title: 'Plan', body: 'Details', buttons: [{ label: 'Choose' }] }] },
        },
      ],
      components
    )

    expect(rendered?.children).toHaveLength(1)
    expect(rendered?.children[0]).toMatchObject({
      props: { title: 'Plan' },
      children: ['Details', { props: { label: 'Choose', action: 'say' } }],
    })
  })

  it('keeps a component property named body separate from its displayed body', () => {
    const custom = new Component({
      type: 'container',
      name: 'Custom',
      description: 'Custom',
      container: { props: z.object({ body: z.number() }), children: [] },
    })
    const [message] = validateNativePresentationInputs(
      [{ component: 'Custom', props: { body: 7 }, body: 'Text' }],
      [custom]
    )

    expect(message).toMatchObject({ props: { body: 7 }, body: 'Text' })
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
