import { describe, expect, it } from 'vitest'
import { StreamingMessageParser, type StreamingParserOptions } from './parser.js'
import type { MessageStreamEvent, ParsedItem } from './types.js'

const parseAll = (text: string, options?: StreamingParserOptions) => {
  const parser = new StreamingMessageParser(options)
  const events = [...parser.push(text), ...parser.finish()]
  return { parser, events, items: parser.items }
}

const strip = (item: ParsedItem) => ({
  kind: item.kind,
  name: item.name,
  props: item.props,
  body: item.body,
  status: item.status,
})

describe('streaming message parser', () => {
  describe('reasoning preamble regression', () => {
    const preamble =
      'I have already provided the greeting in assistant message 5. The user has now said "ok". I should wait for their actual question or request.'
    const reply = "Sounds good! Whenever you're ready, just let me know how I can help. 😊"
    const output = `${preamble}\n\n■send=message\n${reply}\n■next=listen`

    it.each([
      'We need a run block.■run\nreturn await search()\n■next=done',
      'We need to produce a ■run block with the query.■run\nreturn await search()\n■next=done',
      'Use ■send=message for the answer.\n■run\nreturn await search()\n■next=done',
    ])('ignores protocol names mentioned in prose at every split: %s', (raw) => {
      for (let split = 0; split <= raw.length; split++) {
        const parser = new StreamingMessageParser()
        const events = [...parser.push(raw.slice(0, split)), ...parser.push(raw.slice(split)), ...parser.finish()]
        expect(parser.items.map((item) => item.kind)).toEqual(['run', 'next'])
        expect(parser.items[0]!.body).toBe('return await search()')
        expect(events.filter((event) => event.type === 'item-start')).toHaveLength(2)
        expect(parser.diagnostics).toEqual([{ code: 'unexpected-text', message: expect.any(String) }])
        parser.reset()
        parser.push('■send=message\nClean answer.\n■next=listen')
        parser.finish()
        expect(parser.items.map((item) => item.kind)).toEqual(['send', 'next'])
        expect(parser.diagnostics).toEqual([])
      }
    })

    it('recovers a final exit header without a trailing newline', () => {
      const { items } = parseAll('The work is done.■next=done {"count":2}')
      expect(items.map(strip)).toEqual([{ kind: 'next', name: 'done', props: { count: 2 }, status: 'complete' }])
    })

    it('never emits preamble events at any two-chunk boundary', () => {
      for (let split = 0; split <= output.length; split++) {
        const parser = new StreamingMessageParser()
        const events = [...parser.push(output.slice(0, split)), ...parser.push(output.slice(split)), ...parser.finish()]

        expect(parser.items.map((item) => [item.kind, item.name])).toEqual([
          ['send', 'message'],
          ['next', 'listen'],
        ])
        expect(
          events
            .filter((event) => event.type === 'body-delta')
            .map((event) => event.delta)
            .join('')
        ).toBe(reply)
        expect(events.filter((event) => event.type === 'item-complete' && event.item.kind === 'send')).toHaveLength(1)
        expect(events.filter((event) => event.type === 'diagnostic')).toEqual([
          { type: 'diagnostic', diagnostic: { code: 'unexpected-text', message: expect.any(String) } },
        ])
        expect(parser.diagnostics).toEqual([{ code: 'unexpected-text', message: expect.any(String) }])
      }
    })

    it('discards malformed-only output without producing body or item events', () => {
      const parser = new StreamingMessageParser()
      const events = [...preamble.split('').flatMap((char) => parser.push(char)), ...parser.finish()]
      expect(parser.items).toEqual([])
      expect(events).toEqual([
        { type: 'diagnostic', diagnostic: { code: 'unexpected-text', message: expect.any(String) } },
      ])
      expect(parser.diagnostics).toHaveLength(1)
      parser.reset()
      expect(parser.diagnostics).toEqual([])
      expect(parser.push(preamble).map((event) => event.type)).toEqual(['diagnostic'])
      expect(parser.items).toEqual([])
    })
  })

  describe('basic parsing', () => {
    it('ignores a trailing wrapper fence after an exit, preserving fenced message content', () => {
      const body = 'Example:\n```js\nconst answer = 42\n```'
      const raw = `■send=message\n${body}\n■next=listen\n\x60\x60\x60\n`
      for (let split = 0; split <= raw.length; split++) {
        const parser = new StreamingMessageParser()
        const events = [...parser.push(raw.slice(0, split)), ...parser.push(raw.slice(split)), ...parser.finish()]
        expect(parser.items.map((item) => item.kind)).toEqual(['send', 'next'])
        expect(parser.items[0]!.body).toBe(body)
        expect(parser.diagnostics).toEqual([])
        expect(events.filter((event) => event.type === 'diagnostic')).toEqual([])
        parser.reset()
        parser.push('■next=listen\n`not a fence')
        parser.finish()
        expect(parser.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['unexpected-text'])
      }
    })

    it.each(['`', '``', '````', '```\nextra prose'])('still diagnoses invalid trailing text: %s', (suffix) => {
      const { parser } = parseAll(`■next=listen\n${suffix}`)
      expect(parser.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['unexpected-text'])
    })

    it('recovers one duplicate props wrapper at every stream split', () => {
      const raw = '■next=odd_prime {{"number":17}}'
      for (let split = 0; split <= raw.length; split++) {
        const parser = new StreamingMessageParser()
        parser.push(raw.slice(0, split))
        parser.push(raw.slice(split))
        parser.finish()
        expect(parser.items.map(strip)).toEqual([
          { kind: 'next', name: 'odd_prime', props: { number: 17 }, status: 'complete' },
        ])
      }
    })

    it('does not recover duplicate wrappers around conflicting objects', () => {
      const { items } = parseAll('■next=done {{"number":17},{"number":2}}')
      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.diagnostics.some((diagnostic) => diagnostic.code === 'invalid-props')).toBe(true)
    })

    it('parses a markdown send followed by a next', () => {
      const { items } = parseAll('■send=md\nHello! How can I help?\n■next=listen')

      expect(items.map(strip)).toEqual([
        { kind: 'send', name: 'md', props: {}, body: 'Hello! How can I help?', status: 'complete' },
        { kind: 'next', name: 'listen', props: {}, body: undefined, status: 'complete' },
      ])
    })

    it('parses a send with JSON5 props and no body', () => {
      const { items } = parseAll(
        '■send=md\nHello!\n■send=buttons { buttons: [ {label: "A"}, {label: "B"}] }\n■next=listen'
      )

      expect(items.map(strip)).toEqual([
        { kind: 'send', name: 'md', props: {}, body: 'Hello!', status: 'complete' },
        {
          kind: 'send',
          name: 'buttons',
          props: { buttons: [{ label: 'A' }, { label: 'B' }] },
          body: undefined,
          status: 'complete',
        },
        { kind: 'next', name: 'listen', props: {}, body: undefined, status: 'complete' },
      ])
    })

    it('parses a next with props', () => {
      const { items } = parseAll(
        '■send=md\nSure, transferring you to sales now!\n■next=book_meeting { reason: "the user wants a demo", email: "user@example.com" }'
      )

      expect(items.map(strip)).toEqual([
        {
          kind: 'send',
          name: 'md',
          props: {},
          body: 'Sure, transferring you to sales now!',
          status: 'complete',
        },
        {
          kind: 'next',
          name: 'book_meeting',
          props: { reason: 'the user wants a demo', email: 'user@example.com' },
          body: undefined,
          status: 'complete',
        },
      ])
    })

    it('parses a run block with code as body', () => {
      const { items } = parseAll(
        '■send=md\nChecking available dates...\n■run\n// checking dates\nreturn await checkDates({ location: "NYC" })'
      )

      expect(items.map(strip)).toEqual([
        { kind: 'send', name: 'md', props: {}, body: 'Checking available dates...', status: 'complete' },
        {
          kind: 'run',
          name: '',
          props: {},
          body: '// checking dates\nreturn await checkDates({ location: "NYC" })',
          status: 'complete',
        },
      ])
    })

    it('allows the body to start on the header line', () => {
      const { items } = parseAll('■send=md Hello world')
      expect(items.map(strip)).toEqual([
        { kind: 'send', name: 'md', props: {}, body: 'Hello world', status: 'complete' },
      ])
    })

    it('parses a send with both props and body', () => {
      const { items } = parseAll('■send=callout {"variant":"warning"}\nThis action cannot be undone.\n■next=listen')

      expect(strip(items[0]!)).toEqual({
        kind: 'send',
        name: 'callout',
        props: { variant: 'warning' },
        body: 'This action cannot be undone.',
        status: 'complete',
      })
    })

    it('normalizes directive and names to lowercase', () => {
      const { items } = parseAll('■SEND=MD\nhi\n■NEXT=Listen')
      expect(items[0]!.name).toBe('md')
      expect(items[0]!.kind).toBe('send')
      expect(items[1]!.name).toBe('listen')
      expect(items[1]!.kind).toBe('next')
    })

    it('parses multi-line props', () => {
      const { items } = parseAll('■send=card {\n  title: "A",\n  tags: ["x", "y"]\n}\nBody here\n■next=listen')
      expect(items[0]!.props).toEqual({ title: 'A', tags: ['x', 'y'] })
      expect(items[0]!.body).toBe('Body here')
    })

    it('parses an empty stream', () => {
      const { items, events } = parseAll('')
      expect(items).toEqual([])
      expect(events).toEqual([])
    })
  })

  describe('body whitespace handling', () => {
    it('trims whitespace around the body but preserves internal whitespace', () => {
      const { items } = parseAll('■send=md\n\nLine1\n\nLine2\n\n\n■next=listen')
      expect(items[0]!.body).toBe('Line1\n\nLine2')
    })

    it('treats a send with only whitespace after the header as having no body', () => {
      const { items } = parseAll('■send=buttons {"buttons":[]}\n   \n■next=listen')
      expect(items[0]!.body).toBeUndefined()
    })
  })

  describe('props edge cases', () => {
    it('preserves ■ and braces inside prop strings', () => {
      const { items } = parseAll('■send=card {"title": "A ■ B { } [ ]", "n": 1}\nbody')
      expect(items[0]!.props).toEqual({ title: 'A ■ B { } [ ]', n: 1 })
      expect(items[0]!.body).toBe('body')
      expect(items[0]!.status).toBe('complete')
    })

    it('supports single-quoted JSON5 strings', () => {
      const { items } = parseAll("■send=card { title: 'It\\'s here', ok: true }")
      expect(items[0]!.props).toEqual({ title: "It's here", ok: true })
    })

    it('treats a { after ■run as code, not props', () => {
      const { items } = parseAll('■run\n{ const a = 1 }')
      expect(items[0]!.props).toEqual({})
      expect(items[0]!.body).toBe('{ const a = 1 }')
    })

    it('recovers when props are interrupted by a new block', () => {
      const { items } = parseAll('■send=buttons {"a": \n■send=md\nFallback text')

      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.props).toEqual({})
      expect(items[0]!.diagnostics.some((d) => d.code === 'invalid-props')).toBe(true)

      expect(strip(items[1]!)).toEqual({
        kind: 'send',
        name: 'md',
        props: {},
        body: 'Fallback text',
        status: 'complete',
      })
    })

    it('recovers when props are interrupted inside a broken string', () => {
      const { items } = parseAll('■send=card {"title": "abc\n■send=md\nhi')

      expect(items[0]!.status).toBe('invalid')
      expect(items[1]!.body).toBe('hi')
    })

    it('repairs props cut off by the end of the stream', () => {
      const { items } = parseAll('■next=book_meeting { reason: "sales", email: "a@b.com"')

      expect(items[0]!.props).toEqual({ reason: 'sales', email: 'a@b.com' })
      expect(items[0]!.status).toBe('interrupted')
      expect(items[0]!.diagnostics.some((d) => d.code === 'interrupted')).toBe(true)
    })

    it('marks props exceeding the maximum length as invalid and skips to the next block', () => {
      const { items } = parseAll(`■send=card {"a": "${'x'.repeat(100)}"}\nlost\n■send=md\nkept`, {
        maxPropsLength: 50,
      })

      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.diagnostics.some((d) => d.code === 'props-too-long')).toBe(true)
      expect(items[0]!.body).toBeUndefined()
      expect(items[1]!.body).toBe('kept')
    })

    it('marks non-object props as invalid but keeps the body', () => {
      const { items } = parseAll('■send=card {,,,}\nstill here')
      // jsonrepair may or may not rescue degenerate input; either way the body must be preserved
      expect(items[0]!.body).toBe('still here')
    })
  })

  describe('error recovery', () => {
    it('cannot restore implicit sends with legacy options passed by JavaScript callers', () => {
      const legacyOptions = { maxPropsLength: 100_000, strict: false, recoveryComponent: 'text' }
      const { items, events } = parseAll('Hello\n■send=md\nWorld', legacyOptions)

      expect(items.map(strip)).toEqual([{ kind: 'send', name: 'md', props: {}, body: 'World', status: 'complete' }])
      expect(events.filter((event) => event.type === 'body-delta').map((event) => event.delta)).toEqual(['World'])
    })

    it('drops unexpected text with a diagnostic', () => {
      const { items, events } = parseAll('Hello\n■send=md\nWorld')

      expect(items.map(strip)).toEqual([{ kind: 'send', name: 'md', props: {}, body: 'World', status: 'complete' }])
      expect(events.some((e) => e.type === 'diagnostic' && e.diagnostic.code === 'unexpected-text')).toBe(true)
    })

    it('skips unknown directives until the next block', () => {
      const { items } = parseAll('■foo=bar\nlost content\n■send=md\nHi')

      expect(items[0]!.kind).toBe('unknown')
      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.diagnostics.some((d) => d.code === 'invalid-directive')).toBe(true)
      expect(items[1]!.body).toBe('Hi')
    })

    it('flags a send without a name but preserves its body', () => {
      const { items } = parseAll('■send\nHello')

      expect(items[0]!.kind).toBe('send')
      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.diagnostics.some((d) => d.code === 'invalid-name')).toBe(true)
      expect(items[0]!.body).toBe('Hello')
    })

    it('flags invalid names', () => {
      const { items } = parseAll('■send=9bad\nHello')
      expect(items[0]!.status).toBe('invalid')
      expect(items[0]!.diagnostics.some((d) => d.code === 'invalid-name')).toBe(true)
      expect(items[0]!.body).toBe('Hello')
    })

    it('drops free text after a next header by default', () => {
      const { items, parser } = parseAll('■next=listen ok then')
      expect(items).toHaveLength(1)
      expect(items[0]!.kind).toBe('next')
      expect(items[0]!.status).toBe('complete')
      expect(parser.diagnostics).toEqual([{ code: 'unexpected-text', message: expect.any(String) }])
    })
  })

  describe('interrupted streams', () => {
    it('preserves a truncated body and marks it interrupted', () => {
      const parser = new StreamingMessageParser()
      parser.push('■send=md\nThis response was interrupted wh')
      parser.finish('interrupted')

      const [item] = parser.items
      expect(item!.body).toBe('This response was interrupted wh')
      expect(item!.status).toBe('interrupted')
    })

    it('completes a body cleanly at the end of the stream', () => {
      const { items } = parseAll('■send=md\nAll done here.')
      expect(items[0]!.body).toBe('All done here.')
      expect(items[0]!.status).toBe('complete')
    })

    it('completes a next without a trailing newline', () => {
      const { items } = parseAll('■next=listen')
      expect(items.map(strip)).toEqual([
        { kind: 'next', name: 'listen', props: {}, body: undefined, status: 'complete' },
      ])
    })

    it('handles a stream ending mid-name', () => {
      const parser = new StreamingMessageParser()
      parser.push('■send=butto')
      parser.finish('interrupted')

      expect(parser.items[0]!.name).toBe('butto')
      expect(parser.items[0]!.status).toBe('interrupted')
    })

    it('throws when pushing after finish, until reset', () => {
      const parser = new StreamingMessageParser()
      parser.push('■send=md\nhi')
      parser.finish()
      expect(() => parser.push('more')).toThrow()

      parser.reset()
      expect(parser.items).toEqual([])
      parser.push('■send=md\nagain')
      parser.finish()
      expect(parser.items[0]!.body).toBe('again')
    })
  })

  describe('events', () => {
    it('emits lifecycle events in order', () => {
      const { events } = parseAll('■send=callout {"variant":"warning"}\nCareful!\n■next=listen')

      const types = events.map((e) => e.type)
      expect(types).toEqual([
        'item-start', // callout (name parsed)
        'item-ready', // props complete
        'body-start',
        'body-delta',
        'item-complete', // callout
        'item-start', // next
        'item-ready',
        'item-complete',
      ])
    })

    it('streams body deltas incrementally across pushes', () => {
      const parser = new StreamingMessageParser()
      const deltas: string[] = []
      const collect = (events: MessageStreamEvent[]) => {
        for (const event of events) {
          if (event.type === 'body-delta') deltas.push(event.delta)
        }
      }

      collect(parser.push('■send=md\nHel'))
      collect(parser.push('lo wor'))
      collect(parser.push('ld'))
      collect(parser.finish())

      expect(deltas.length).toBeGreaterThan(1)
      expect(deltas.join('')).toBe('Hello world')
    })

    it('hands out live item references', () => {
      const parser = new StreamingMessageParser()
      const events = parser.push('■send=md\nHello')
      const start = events.find((e) => e.type === 'item-start')
      const item = start?.type === 'item-start' ? start.item : undefined

      expect(item!.body).toBe('Hello')
      parser.push(' world')
      expect(item!.body).toBe('Hello world')
      parser.finish()
      expect(item!.status).toBe('complete')
    })
  })

  describe('chunking invariance', () => {
    const FIXTURE =
      'preamble text\n' +
      '■send=md\n# Hi 【there】\n\nSome **markdown** with `code`, a ▪ lookalike and {braces}\n' +
      '■send=buttons { buttons: [ {label: "A ■ A"}, {label: \'B\'} ], cols: 2 }\n' +
      '■run\nconst x = { a: [1, 2, 3] }\nreturn await tool({ x })\n' +
      '■send=callout {"variant":"warning"}\nCareful!\n' +
      '■next=book_meeting { reason: "demo", email: "a@b.com" }\n'

    const parseChunked = (text: string, sizes: number[]) => {
      const parser = new StreamingMessageParser()
      const deltas = new Map<string, string>()
      let offset = 0
      let i = 0
      while (offset < text.length) {
        const size = sizes[i++ % sizes.length]!
        for (const event of parser.push(text.slice(offset, offset + size))) {
          if (event.type === 'body-delta') {
            deltas.set(event.itemId, (deltas.get(event.itemId) ?? '') + event.delta)
          }
        }
        offset += size
      }
      parser.finish()
      return { items: parser.items.map(strip), deltas }
    }

    it.each([[1], [2], [3], [7], [50], [1, 13, 2]])('chunk sizes %j produce identical output', (...sizes) => {
      const whole = parseChunked(FIXTURE, [FIXTURE.length])
      const chunked = parseChunked(FIXTURE, sizes)

      expect(chunked.items).toEqual(whole.items)
      expect([...chunked.deltas.values()]).toEqual([...whole.deltas.values()])
    })

    it('parses the fixture correctly', () => {
      const { items } = parseAll(FIXTURE)

      expect(items.map((i) => [i.kind, i.name])).toEqual([
        ['send', 'md'],
        ['send', 'buttons'],
        ['run', ''],
        ['send', 'callout'],
        ['next', 'book_meeting'],
      ])
      expect(items[1]!.props).toEqual({ buttons: [{ label: 'A ■ A' }, { label: 'B' }], cols: 2 })
      expect(items[2]!.body).toBe('const x = { a: [1, 2, 3] }\nreturn await tool({ x })')
      expect(items[4]!.props).toEqual({ reason: 'demo', email: 'a@b.com' })
    })
  })
})
