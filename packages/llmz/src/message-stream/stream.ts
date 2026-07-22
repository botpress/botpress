import { StreamingMessageParser, type StreamingParserOptions } from './parser.js'
import { ReplayableAsyncIterable } from './replayable.js'
import { MARKER, type Diagnostic, type MessageStreamEvent, type ParsedItem } from './types.js'

export abstract class BaseResponse {
  protected constructor(
    public readonly action: 'send' | 'run' | 'next',
    /** The underlying parsed item. Live: status, body and diagnostics update as the stream advances. */
    public readonly item: ParsedItem
  ) {}

  public get diagnostics(): Diagnostic[] {
    return this.item.diagnostics
  }
}

/** `■send=<component> { props? }` followed by an optional streaming body. */
export class SendResponse extends BaseResponse {
  public constructor(
    item: ParsedItem,
    /** The streaming body. Replayable: it can be consumed while streaming and read again later. */
    public readonly content: ReplayableAsyncIterable<string>
  ) {
    super('send', item)
  }

  public get component(): string {
    return this.item.name
  }

  public get props(): Record<string, unknown> {
    return this.item.props
  }

  public static formatToText(component: string, props?: Record<string, unknown>, body?: string): string {
    const header = `${MARKER}send=${component}${props && Object.keys(props).length ? ` ${JSON.stringify(props)}` : ''}`
    return body ? `${header}\n${body}` : header
  }
}

/** `■run` followed by streaming code. */
export class RunResponse extends BaseResponse {
  public constructor(
    item: ParsedItem,
    /** The streaming code. Replayable: it can be consumed while streaming and read again later. */
    public readonly code: ReplayableAsyncIterable<string>
  ) {
    super('run', item)
  }

  public static formatToText(code: string): string {
    return `${MARKER}run\n${code}`
  }
}

/** `■next=<name> { props? }` — hands control to an exit (e.g. listen) with optional props. */
export class NextResponse extends BaseResponse {
  public constructor(item: ParsedItem) {
    super('next', item)
  }

  public get name(): string {
    return this.item.name
  }

  public get props(): Record<string, unknown> {
    return this.item.props
  }

  public static formatToText(name: string, props?: Record<string, unknown>): string {
    return `${MARKER}next=${name}${props && Object.keys(props).length ? ` ${JSON.stringify(props)}` : ''}`
  }
}

export type MessageStreamResponse = SendResponse | RunResponse | NextResponse

/**
 * Pulls transport chunks through the parser on demand and hands out events one
 * at a time. Shared by the main response loop and by body streams; pulls are
 * serialized so interleaved consumers cannot race the source iterator.
 */
class EventPump {
  private _iterator: AsyncIterator<string>
  private _parser: StreamingMessageParser
  private _queue: MessageStreamEvent[] = []
  private _sourceDone = false
  private _lock: Promise<unknown> = Promise.resolve()

  public constructor(stream: AsyncIterable<string>, parser: StreamingMessageParser) {
    this._iterator = stream[Symbol.asyncIterator]()
    this._parser = parser
  }

  public next(): Promise<MessageStreamEvent | undefined> {
    const next = this._lock.then(() => this._next())
    this._lock = next.catch(() => {})
    return next
  }

  public unshift(event: MessageStreamEvent): void {
    this._queue.unshift(event)
  }

  private async _next(): Promise<MessageStreamEvent | undefined> {
    while (this._queue.length === 0) {
      if (this._sourceDone) {
        return undefined
      }

      let result: IteratorResult<string>
      try {
        result = await this._iterator.next()
      } catch {
        // Transport failure: preserve everything received so far
        this._sourceDone = true
        this._queue.push(...this._parser.finish('interrupted'))
        continue
      }

      if (result.done) {
        this._sourceDone = true
        this._queue.push(...this._parser.finish())
      } else {
        this._queue.push(...this._parser.push(result.value))
      }
    }
    return this._queue.shift()
  }
}

/**
 * Parses a raw LLM text stream into typed responses.
 *
 * `send` and `run` responses are yielded as soon as their header is parsed —
 * while their body is still streaming — with the body exposed as a replayable
 * async iterable. `next` responses are yielded once complete.
 *
 * The body streams are pull-based: consuming them drives the underlying
 * transport. Requesting the next response first drains the previous body into
 * its replay cache, so it can always be read later.
 */
export function parseStream(
  stream: AsyncIterable<string>,
  options?: StreamingParserOptions
): AsyncIterable<MessageStreamResponse> {
  return parseResponses(stream, options)
}

/** Parses a complete text (convenience wrapper over {@link parseStream}). */
export function parseText(text: string, options?: StreamingParserOptions): AsyncIterable<MessageStreamResponse> {
  return parseResponses(
    (async function* () {
      yield text
    })(),
    options
  )
}

async function* parseResponses(
  stream: AsyncIterable<string>,
  options?: StreamingParserOptions
): AsyncIterable<MessageStreamResponse> {
  const parser = new StreamingMessageParser(options)
  const pump = new EventPump(stream, parser)
  let activeBody: ReplayableAsyncIterable<string> | undefined

  while (true) {
    if (activeBody) {
      // Drain the previous body into its replay cache before moving on
      await activeBody.collect()
      activeBody = undefined
    }

    const event = await pump.next()
    if (!event) {
      return
    }

    if (event.type === 'item-ready' && (event.item.kind === 'send' || event.item.kind === 'run')) {
      const body = new ReplayableAsyncIterable(bodyStream(pump, event.item.id))
      activeBody = body
      yield event.item.kind === 'send' ? new SendResponse(event.item, body) : new RunResponse(event.item, body)
      continue
    }

    if (event.type === 'item-complete' && event.item.kind === 'next') {
      yield new NextResponse(event.item)
      continue
    }

    // diagnostics and remaining lifecycle events are already reflected on the items themselves
  }
}

async function* bodyStream(pump: EventPump, itemId: string): AsyncIterable<string> {
  while (true) {
    const event = await pump.next()
    if (!event) {
      return
    }
    if (event.type === 'body-delta' && event.itemId === itemId) {
      yield event.delta
      continue
    }
    if (event.type === 'body-start' && event.itemId === itemId) {
      continue
    }
    if (event.type === 'diagnostic') {
      continue
    }
    if (event.type === 'item-complete' && event.item.id === itemId) {
      return
    }
    // The event belongs to a later item: put it back for the main loop
    pump.unshift(event)
    return
  }
}
