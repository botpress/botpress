import { assert, describe, expect, it } from 'vitest'
import { collectText, ReplayableAsyncIterable } from './replayable.js'
import {
  NextResponse,
  parseStream,
  parseText,
  RunResponse,
  SendResponse,
  type MessageStreamResponse,
} from './stream.js'

const collectResponses = async (stream: AsyncIterable<MessageStreamResponse>) => {
  const responses: MessageStreamResponse[] = []
  for await (const response of stream) {
    responses.push(response)
  }
  return responses
}

describe('message stream', () => {
  it('parses a send followed by a next', async () => {
    const parsed = parseText('■send=md\nHello, how are you?!\nSecond line here\n■next=listen')
    const iterator = parsed[Symbol.asyncIterator]()

    const first = await iterator.next()
    assert(first.done === false)
    assert(first.value instanceof SendResponse)
    expect(first.value.action).toBe('send')
    expect(first.value.component).toBe('md')
    expect(await collectText(first.value.content)).toBe('Hello, how are you?!\nSecond line here')

    const second = await iterator.next()
    assert(second.done === false)
    assert(second.value instanceof NextResponse)
    expect(second.value.action).toBe('next')
    expect(second.value.name).toBe('listen')

    const third = await iterator.next()
    assert(third.done === true)
  })

  it('parses props on send and next', async () => {
    const responses = await collectResponses(
      parseText(
        '■send=md\nSure!\n■send=buttons { buttons: [ {label: "A"}, {label: "B"}] }\n■next=book_meeting { reason: "demo", email: "user@example.com" }'
      )
    )

    expect(responses).toHaveLength(3)

    assert(responses[1] instanceof SendResponse)
    expect(responses[1].component).toBe('buttons')
    expect(responses[1].props).toEqual({ buttons: [{ label: 'A' }, { label: 'B' }] })
    expect(await collectText(responses[1].content)).toBe('')

    assert(responses[2] instanceof NextResponse)
    expect(responses[2].name).toBe('book_meeting')
    expect(responses[2].props).toEqual({ reason: 'demo', email: 'user@example.com' })
  })

  it('parses a run block and exposes the code as a stream', async () => {
    const responses = await collectResponses(
      parseText('■send=md\nChecking dates...\n■run\n// checking dates\nreturn await checkDates({ year: 2026 })')
    )

    expect(responses).toHaveLength(2)
    assert(responses[1] instanceof RunResponse)
    expect(responses[1].action).toBe('run')
    expect(await collectText(responses[1].code)).toBe('// checking dates\nreturn await checkDates({ year: 2026 })')
  })

  it('handles abrupt endings', async () => {
    const responses = await collectResponses(parseText('■send=md\nHello, how are'))

    expect(responses).toHaveLength(1)
    assert(responses[0] instanceof SendResponse)
    expect(await collectText(responses[0].content)).toBe('Hello, how are')
  })

  it('streams chunks arriving in parts', async () => {
    const parsed = parseStream(
      (async function* () {
        yield '\n'
        yield '■send=m'
        yield 'd\nHello, how are you?!\n'
        yield 'Second line here\n'
        yield '■next=book_'
        yield 'meeting { reason: "the user said hi" }\n'
      })()
    )

    const responses = await collectResponses(parsed)

    expect(responses).toHaveLength(2)
    assert(responses[0] instanceof SendResponse)
    expect(await collectText(responses[0].content)).toBe('Hello, how are you?!\nSecond line here')
    assert(responses[1] instanceof NextResponse)
    expect(responses[1].name).toBe('book_meeting')
    expect(responses[1].props).toEqual({ reason: 'the user said hi' })
  })

  it('delivers body content incrementally while the source is still streaming', async () => {
    let pulled = 0
    const parsed = parseStream(
      (async function* () {
        pulled++
        yield '■send=md\nfirst'
        pulled++
        yield ' second'
        pulled++
        yield ' third'
      })()
    )

    const iterator = parsed[Symbol.asyncIterator]()
    const first = await iterator.next()
    assert(first.done === false && first.value instanceof SendResponse)

    // Only enough of the source to produce the header + first content should have been pulled
    expect(pulled).toBe(1)

    const chunks: string[] = []
    for await (const chunk of first.value.content) {
      chunks.push(chunk)
    }

    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.join('')).toBe('first second third')
  })

  it('replays content after the stream has been fully consumed', async () => {
    const parsed = parseText('■send=md\nHello!\n■send=md\nSecond message\n■next=listen')
    const responses = await collectResponses(parsed)

    // bodies were auto-drained while iterating; they must still be readable
    assert(responses[0] instanceof SendResponse)
    assert(responses[1] instanceof SendResponse)
    expect(await collectText(responses[0].content)).toBe('Hello!')
    expect(await collectText(responses[0].content)).toBe('Hello!') // replay twice
    expect(await collectText(responses[1].content)).toBe('Second message')

    // the underlying item also carries the final body
    expect(responses[0].item.body).toBe('Hello!')
    expect(responses[0].item.status).toBe('complete')
  })

  it('exposes diagnostics on recovered responses', async () => {
    const responses = await collectResponses(parseText('Hello there\n■next=listen'))

    expect(responses).toHaveLength(2)
    assert(responses[0] instanceof SendResponse)
    expect(responses[0].component).toBe('md')
    expect(await collectText(responses[0].content)).toBe('Hello there')
    expect(responses[0].diagnostics.some((d) => d.code === 'unexpected-text')).toBe(true)
  })

  it('marks items interrupted when the transport fails mid-stream', async () => {
    const parsed = parseStream(
      (async function* () {
        yield '■send=md\nHalf a mess'
        throw new Error('boom')
      })()
    )

    const responses = await collectResponses(parsed)

    expect(responses).toHaveLength(1)
    assert(responses[0] instanceof SendResponse)
    expect(await collectText(responses[0].content)).toBe('Half a mess')
    expect(responses[0].item.status).toBe('interrupted')
  })

  it('round-trips formatToText helpers', async () => {
    const text = [
      SendResponse.formatToText('md', {}, 'Hello **there**'),
      SendResponse.formatToText('buttons', { buttons: [{ label: 'A' }] }),
      RunResponse.formatToText('return 1'),
      NextResponse.formatToText('book_meeting', { email: 'a@b.com' }),
    ].join('\n')

    const responses = await collectResponses(parseText(text))

    expect(responses).toHaveLength(4)
    assert(responses[0] instanceof SendResponse)
    expect(await collectText(responses[0].content)).toBe('Hello **there**')
    assert(responses[1] instanceof SendResponse)
    expect(responses[1].props).toEqual({ buttons: [{ label: 'A' }] })
    assert(responses[2] instanceof RunResponse)
    expect(await collectText(responses[2].code)).toBe('return 1')
    assert(responses[3] instanceof NextResponse)
    expect(responses[3].name).toBe('book_meeting')
    expect(responses[3].props).toEqual({ email: 'a@b.com' })
  })
})

describe('replayable async iterable', () => {
  it('replays cached chunks to late iterators', async () => {
    const replayable = new ReplayableAsyncIterable(
      (async function* () {
        yield 'a'
        yield 'b'
        yield 'c'
      })()
    )

    expect(await collectText(replayable)).toBe('abc')
    expect(await collectText(replayable)).toBe('abc')
    expect(replayable.done).toBe(true)
    expect(replayable.chunks).toEqual(['a', 'b', 'c'])
  })

  it('supports interleaved concurrent iterations', async () => {
    let produced = 0
    const replayable = new ReplayableAsyncIterable(
      (async function* () {
        for (const chunk of ['a', 'b', 'c', 'd']) {
          produced++
          yield chunk
        }
      })()
    )

    const [first, second] = await Promise.all([collectText(replayable), collectText(replayable)])

    expect(first).toBe('abcd')
    expect(second).toBe('abcd')
    expect(produced).toBe(4) // source consumed exactly once
  })

  it('caches a source failure and rethrows it on every iteration', async () => {
    // Explicit iterator (not a generator) so pulls after the failure are observable
    let pulls = 0
    const chunks = ['a', 'b']
    const source: AsyncIterable<string> = {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          pulls++
          const value = chunks.shift()
          if (value === undefined) {
            throw new Error('transport died')
          }
          return { value, done: false }
        },
      }),
    }
    const replayable = new ReplayableAsyncIterable(source)

    // First consumer gets the chunks received before the failure, then the error
    const received: string[] = []
    await expect(async () => {
      for await (const chunk of replayable) {
        received.push(chunk)
      }
    }).rejects.toThrow('transport died')
    expect(received).toEqual(['a', 'b'])
    expect(replayable.done).toBe(true)

    // Replays deliver the cached chunks then rethrow the same error —
    // instead of silently ending short or pulling the dead iterator again
    const replayed: string[] = []
    await expect(async () => {
      for await (const chunk of replayable) {
        replayed.push(chunk)
      }
    }).rejects.toThrow('transport died')
    expect(replayed).toEqual(['a', 'b'])
    expect(pulls).toBe(3) // 2 chunks + 1 failure; the dead source is never pulled again
  })
})
