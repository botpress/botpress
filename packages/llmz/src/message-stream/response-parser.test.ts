import { describe, expect, it } from 'vitest'
import { ResponseParser } from './response-parser.js'
import type { MessageStreamEvent } from './types.js'

describe('response envelopes', () => {
  it.each([
    '■start\n■send=message\nHello!\n■next=listen\n■end',
    '■start\r\n■send=message\r\nHello!\r\n■next=listen\r\n■end\r\n',
    '"""\n■start\n■send=message\nHello!\n■next=listen\n■end\n"""',
  ])('parses whole responses, characters, and every split without boundary leakage: %s', (raw) => {
    for (const chunks of [
      [...raw],
      ...Array.from({ length: raw.length + 1 }, (_, i) => [raw.slice(0, i), raw.slice(i)]),
    ]) {
      const parser = new ResponseParser()
      const events = chunks.flatMap((chunk) => parser.push(chunk))
      events.push(...parser.finish())
      expect(parser.framed).toBe(true)
      expect(parser.valid).toBe(true)
      expect(parser.items.map((item) => item.kind)).toEqual(['send', 'next'])
      expect(parser.items[0]!.body).toBe('Hello!')
      expect(
        events
          .filter((e) => e.type === 'body-delta')
          .map((e) => e.delta)
          .join('')
      ).toBe('Hello!')
      expect(parser.diagnostics.every((d) => d.code === 'example-delimiter')).toBe(true)
    }
  })

  it.each([
    '■start',
    '■start\n■run\nawait charge()',
    '■start\n■run\nawait charge()\n■en',
    '■start\n■send=message\nHello\n■next=listen',
    '■start\nprivate reasoning\n■send=message\nHello\n■next=listen\n■end',
    '■start\n■start\n■run\nawait charge()\n■end',
    '■start\n■next=listen\n■end\n■run\nawait charge()',
    '■start\n■next=listen\n■end\n■end',
  ])('rejects incomplete or malformed envelopes without actionable items: %s', (raw) => {
    const parser = new ResponseParser()
    for (const char of raw) parser.push(char)
    parser.finish()
    expect(parser.valid).toBe(false)
    expect(parser.items).toEqual([])
    expect(parser.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid-envelope' }))
  })

  it('does not buffer ordinary message text while waiting for the envelope end', () => {
    const parser = new ResponseParser()
    const events: MessageStreamEvent[] = parser.push('■start\n■send=message\nHello')
    expect(
      events
        .filter((e) => e.type === 'body-delta')
        .map((e) => e.delta)
        .join('')
    ).toBe('Hello')
    expect(parser.valid).toBe(false)
    parser.push('!\n■next=listen\n■end')
    parser.finish()
    expect(parser.valid).toBe(true)
  })
})
