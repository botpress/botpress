import JSON5 from 'json5'
import { jsonrepair } from 'jsonrepair'
import {
  MARKER,
  NAME_REGEX,
  type Diagnostic,
  type ItemStatus,
  type MessageStreamEvent,
  type ParsedItem,
} from './types.js'

export type StreamingParserOptions = {
  /** Maximum number of characters buffered for a props object before the item is marked invalid. Default: 100 000. */
  maxPropsLength?: number
  /** When true, unexpected free text is dropped (with a diagnostic) instead of being recovered into an implicit `send`. Default: false. */
  strict?: boolean
  /** Component used to recover unexpected free text into an implicit `■send`. Default: 'md'. */
  recoveryComponent?: string
}

type ParserState =
  | 'idle' // waiting for the next ■
  | 'directive' // reading send/run/next after ■
  | 'name' // reading the component/exit name after =
  | 'header' // header line after the name, props may still follow
  | 'props' // buffering the props object
  | 'body-wait' // header done, waiting for the first body character
  | 'body' // streaming body content
  | 'skip' // discarding content until the next ■

const isWhitespace = (char: string) => /\s/.test(char)

/**
 * Lenient JSON parsing: JSON5 first (unquoted keys, single quotes, trailing
 * commas), then jsonrepair for anything else the model got slightly wrong.
 */
export const tryParseJson = (text: string): unknown => {
  try {
    return JSON5.parse(text)
  } catch {
    try {
      return JSON5.parse(jsonrepair(text))
    } catch {
      return undefined
    }
  }
}

/**
 * Incremental, chunk-boundary-agnostic parser for the message-stream protocol.
 *
 * The parser is purely syntactic: it knows the reserved `■` symbol and the
 * directive grammar, but nothing about registered components, exits or their
 * schemas. Semantic validation is a separate step (see `validator.ts`).
 *
 * Pushing the same text split across arbitrary chunk boundaries always produces
 * the same items and the same concatenated body deltas. For a higher-level
 * `AsyncIterable` API, see `stream.ts`.
 */
export class StreamingMessageParser {
  private _maxPropsLength: number
  private _strict: boolean
  private _recoveryComponent: string

  private _state: ParserState = 'idle'
  private _items: ParsedItem[] = []
  private _current: ParsedItem | undefined
  private _currentReady = false
  private _counter = 0
  private _finished = false

  private _directiveBuffer = ''
  private _nameBuffer = ''

  private _propsBuffer = ''
  private _propsDepth = 0
  private _quoteChar: '"' | "'" | undefined
  private _escaped = false
  private _propsBroken = false

  private _bodyDelta = ''
  private _pendingWhitespace = ''

  public constructor(options: StreamingParserOptions = {}) {
    this._maxPropsLength = options.maxPropsLength ?? 100_000
    this._strict = options.strict ?? false
    this._recoveryComponent = options.recoveryComponent ?? 'md'
  }

  /** All items parsed so far, in order of appearance. */
  public get items(): ParsedItem[] {
    return [...this._items]
  }

  public push(chunk: string): MessageStreamEvent[] {
    if (this._finished) {
      throw new Error('Parser has already finished. Call reset() before parsing a new stream.')
    }

    const events: MessageStreamEvent[] = []
    for (const char of chunk) {
      this._processChar(char, events)
    }
    this._flushBodyDelta(events)
    return events
  }

  /**
   * Signals the end of the transport stream.
   * Pass `'interrupted'` when the stream was cut short (aborted request, network
   * error) so the active item is marked `interrupted` instead of `complete`.
   * All received content is preserved either way.
   */
  public finish(reason: 'end' | 'interrupted' = 'end'): MessageStreamEvent[] {
    if (this._finished) {
      return []
    }
    this._finished = true

    const events: MessageStreamEvent[] = []
    const status: ItemStatus | undefined = reason === 'interrupted' ? 'interrupted' : undefined

    switch (this._state) {
      case 'directive':
        this._endDirective(events, undefined)
        this._completeCurrent(events, status)
        break
      case 'name':
        this._endName(events)
        this._completeCurrent(events, status)
        break
      case 'header':
      case 'body-wait':
        this._completeCurrent(events, status)
        break
      case 'props':
        this._endPartialProps(events)
        this._completeCurrent(events, 'interrupted')
        break
      case 'body':
        this._pendingWhitespace = ''
        this._flushBodyDelta(events)
        this._completeCurrent(events, status)
        break
      case 'idle':
      case 'skip':
        break
    }

    return events
  }

  public reset(): void {
    this._state = 'idle'
    this._items = []
    this._current = undefined
    this._currentReady = false
    this._counter = 0
    this._finished = false
    this._directiveBuffer = ''
    this._nameBuffer = ''
    this._propsBuffer = ''
    this._propsDepth = 0
    this._quoteChar = undefined
    this._escaped = false
    this._propsBroken = false
    this._bodyDelta = ''
    this._pendingWhitespace = ''
  }

  private _processChar(char: string, events: MessageStreamEvent[]): void {
    switch (this._state) {
      case 'idle': {
        if (char === MARKER) {
          this._beginItem()
        } else if (!isWhitespace(char)) {
          this._beginRecovery(char, events)
        }
        return
      }

      case 'directive': {
        if (char === '=') {
          this._endDirective(events, '=')
        } else if (char === MARKER) {
          this._endDirective(events, undefined)
          this._completeCurrent(events)
          this._beginItem()
        } else if (char === '\n') {
          this._endDirective(events, '\n')
        } else if (isWhitespace(char)) {
          this._endDirective(events, ' ')
        } else if (char === '{') {
          this._endDirective(events, '{')
        } else {
          this._directiveBuffer += char
        }
        return
      }

      case 'name': {
        if (char === MARKER) {
          this._endName(events)
          this._completeCurrent(events)
          this._beginItem()
        } else if (char === '{') {
          this._endName(events)
          this._afterHeaderChar(char, events)
        } else if (char === '\n') {
          this._endName(events)
          this._afterHeaderChar(char, events)
        } else if (isWhitespace(char)) {
          this._endName(events)
          this._state = 'header'
        } else {
          this._nameBuffer += char
        }
        return
      }

      case 'header': {
        this._afterHeaderChar(char, events)
        return
      }

      case 'props': {
        this._processPropsChar(char, events)
        return
      }

      case 'body-wait': {
        if (char === MARKER) {
          this._completeCurrent(events)
          this._beginItem()
        } else if (!isWhitespace(char)) {
          this._startBody(events)
          this._appendBody(char)
        }
        return
      }

      case 'body': {
        if (char === MARKER) {
          this._pendingWhitespace = ''
          this._flushBodyDelta(events)
          this._completeCurrent(events)
          this._beginItem()
        } else {
          this._appendBody(char)
        }
        return
      }

      case 'skip': {
        if (char === MARKER) {
          this._beginItem()
        }
        return
      }
    }
  }

  /** Handles a character on the header line, after the directive and name have been parsed. */
  private _afterHeaderChar(char: string, events: MessageStreamEvent[]): void {
    const item = this._current!

    if (char === MARKER) {
      this._completeCurrent(events)
      this._beginItem()
      return
    }

    // Props may only appear on the header line, and only for send/next.
    // For `run`, a `{` is code and belongs to the body.
    if (char === '{' && (item.kind === 'send' || item.kind === 'next')) {
      this._startProps(char)
      return
    }

    if (char === '\n') {
      if (item.kind === 'next') {
        // next has no body: the header line is the whole item
        this._completeCurrent(events)
        this._state = 'idle'
      } else {
        this._state = 'body-wait'
      }
      return
    }

    if (isWhitespace(char)) {
      return
    }

    if (item.kind === 'next') {
      // Free text after a completed ■next header: finish the item, recover the text
      this._completeCurrent(events)
      this._beginRecovery(char, events)
      return
    }

    // send/run: body may start on the header line
    this._startBody(events)
    this._appendBody(char)
  }

  private _processPropsChar(char: string, events: MessageStreamEvent[]): void {
    this._propsBuffer += char

    if (this._propsBuffer.length > this._maxPropsLength) {
      this._failProps(
        events,
        `props exceeded the maximum length of ${this._maxPropsLength} characters`,
        'props-too-long'
      )
      this._completeCurrent(events)
      this._state = 'skip'
      return
    }

    if (this._escaped) {
      this._escaped = false
      return
    }

    if (this._quoteChar) {
      if (char === '\\') {
        this._escaped = true
      } else if (char === this._quoteChar) {
        this._quoteChar = undefined
      } else if (char === '\n' || char === '\r') {
        // A raw newline inside a string can never form valid JSON/JSON5. From
        // here on, a `■` is treated as recovery rather than string content.
        this._propsBroken = true
      } else if (char === MARKER && this._propsBroken) {
        this._failProps(events, 'props were interrupted by a new block')
        this._completeCurrent(events)
        this._beginItem()
      }
      return
    }

    if (char === '"' || char === "'") {
      this._quoteChar = char
    } else if (char === MARKER) {
      // `■` is never valid outside of a string
      this._failProps(events, 'props were interrupted by a new block')
      this._completeCurrent(events)
      this._beginItem()
    } else if (char === '{' || char === '[') {
      this._propsDepth++
    } else if (char === '}' || char === ']') {
      this._propsDepth--
      if (this._propsDepth <= 0) {
        this._endProps(events)
      }
    }
  }

  private _beginItem(): void {
    const item: ParsedItem = {
      id: `item-${this._counter++}`,
      kind: 'unknown',
      name: '',
      props: {},
      status: 'pending',
      diagnostics: [],
    }
    this._items.push(item)
    this._current = item
    this._currentReady = false
    this._directiveBuffer = ''
    this._nameBuffer = ''
    this._state = 'directive'
  }

  /**
   * Finalizes the directive token. `terminator` tells us what ended it:
   * '=' (a name follows), whitespace/newline/'{' (no name), or undefined (■ or end of stream).
   */
  private _endDirective(events: MessageStreamEvent[], terminator: '=' | ' ' | '\n' | '{' | undefined): void {
    const item = this._current!
    const directive = this._directiveBuffer.toLowerCase()

    if (directive === 'send' || directive === 'next' || directive === 'run') {
      item.kind = directive
    } else {
      item.kind = 'unknown'
      item.status = 'invalid'
      this._diagnostic(events, {
        code: 'invalid-directive',
        message: `Unknown directive "■${this._directiveBuffer}". Expected ■send, ■run or ■next.`,
        itemId: item.id,
      })
      events.push({ type: 'item-start', item })
      // Discard everything until the next block: we cannot tell props from body for an unknown directive
      this._completeCurrent(events)
      this._state = 'skip'
      return
    }

    if (item.kind === 'run') {
      events.push({ type: 'item-start', item })
      if (terminator === '=') {
        // Tolerated: `■run=...` — run takes no name, whatever follows is treated as header content
        this._diagnostic(events, {
          code: 'invalid-directive',
          message: '■run does not take a name',
          itemId: item.id,
        })
        this._state = 'header'
      } else if (terminator === '\n') {
        this._state = 'body-wait'
      } else if (terminator === '{' || terminator === ' ') {
        this._state = 'header'
        if (terminator === '{') {
          // `{` after run is code, not props
          this._startBody(events)
          this._appendBody('{')
        }
      }
      return
    }

    // send/next require a name
    if (terminator === '=') {
      this._nameBuffer = ''
      this._state = 'name'
      return
    }

    item.status = 'invalid'
    this._diagnostic(events, {
      code: 'invalid-name',
      message: `■${directive} requires a name (e.g. ■${directive}=example)`,
      itemId: item.id,
    })
    events.push({ type: 'item-start', item })

    if (terminator === '\n') {
      this._state = item.kind === 'next' ? 'idle' : 'body-wait'
      if (item.kind === 'next') {
        this._completeCurrent(events)
      }
    } else if (terminator === '{') {
      this._startProps('{')
    } else {
      this._state = 'header'
    }
  }

  private _endName(events: MessageStreamEvent[]): void {
    const item = this._current!
    const name = this._nameBuffer.toLowerCase()
    item.name = name

    if (!NAME_REGEX.test(name)) {
      item.status = 'invalid'
      this._diagnostic(events, {
        code: 'invalid-name',
        message: `Invalid name "${this._nameBuffer}" for ■${item.kind}`,
        itemId: item.id,
      })
    }

    events.push({ type: 'item-start', item })
  }

  private _startProps(char: string): void {
    this._propsBuffer = char
    this._propsDepth = 1
    this._quoteChar = undefined
    this._escaped = false
    this._propsBroken = false
    this._state = 'props'
  }

  private _endProps(events: MessageStreamEvent[]): void {
    const item = this._current!
    const parsed = tryParseJson(this._propsBuffer)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this._failProps(events, 'props are not a valid JSON object')
    } else {
      item.props = parsed as Record<string, unknown>
      this._ready(events)
    }

    if (item.kind === 'next') {
      this._completeCurrent(events)
      this._state = 'idle'
    } else {
      this._state = 'body-wait'
    }
  }

  /** Attempts to salvage props that were cut off by the end of the stream. */
  private _endPartialProps(events: MessageStreamEvent[]): void {
    const item = this._current!
    const repaired = tryParseJson(this._propsBuffer)

    this._diagnostic(events, {
      code: 'interrupted',
      message: `Props of ■${item.kind} were interrupted by the end of the stream`,
      itemId: item.id,
    })

    if (repaired && typeof repaired === 'object' && !Array.isArray(repaired)) {
      item.props = repaired as Record<string, unknown>
    } else {
      item.status = 'invalid'
      this._diagnostic(events, {
        code: 'invalid-props',
        message: `Invalid props for ■${item.kind}: props are not a valid JSON object`,
        itemId: item.id,
      })
    }
  }

  private _failProps(
    events: MessageStreamEvent[],
    detail: string,
    code: 'invalid-props' | 'props-too-long' = 'invalid-props'
  ): void {
    const item = this._current!
    item.status = 'invalid'
    item.props = {}
    this._diagnostic(events, {
      code,
      message: `Invalid props for ■${item.kind}${item.name ? `=${item.name}` : ''}: ${detail}`,
      itemId: item.id,
    })
  }

  private _startBody(events: MessageStreamEvent[]): void {
    const item = this._current!
    this._ready(events)
    item.body ??= ''
    this._pendingWhitespace = ''
    events.push({ type: 'body-start', itemId: item.id })
    this._state = 'body'
  }

  private _appendBody(char: string): void {
    if (isWhitespace(char)) {
      // Trailing whitespace before the next ■ or the end of the stream is
      // formatting, not content: hold it back until more content arrives.
      this._pendingWhitespace += char
      return
    }
    if (this._pendingWhitespace) {
      this._emitBodyText(this._pendingWhitespace)
      this._pendingWhitespace = ''
    }
    this._emitBodyText(char)
  }

  private _emitBodyText(text: string): void {
    this._current!.body += text
    this._bodyDelta += text
  }

  private _flushBodyDelta(events: MessageStreamEvent[]): void {
    if (this._bodyDelta && this._current) {
      events.push({ type: 'body-delta', itemId: this._current.id, delta: this._bodyDelta })
    }
    this._bodyDelta = ''
  }

  private _ready(events: MessageStreamEvent[]): void {
    const item = this._current
    if (!item || this._currentReady) {
      return
    }
    this._currentReady = true
    if (item.status !== 'invalid') {
      item.status = 'streaming'
    }
    events.push({ type: 'item-ready', item })
  }

  private _completeCurrent(events: MessageStreamEvent[], forcedStatus?: ItemStatus): void {
    const item = this._current
    if (!item) {
      return
    }
    this._ready(events)

    if (item.status !== 'invalid') {
      item.status = forcedStatus ?? 'complete'
    }

    events.push({ type: 'item-complete', item })
    this._current = undefined
    this._currentReady = false
  }

  private _beginRecovery(char: string, events: MessageStreamEvent[]): void {
    if (this._strict) {
      this._diagnostic(events, {
        code: 'unexpected-text',
        message: 'Encountered text outside of a ■ block',
      })
      this._state = 'skip'
      return
    }

    const item: ParsedItem = {
      id: `item-${this._counter++}`,
      kind: 'send',
      name: this._recoveryComponent,
      props: {},
      body: '',
      status: 'pending',
      diagnostics: [],
    }
    this._items.push(item)
    this._current = item
    this._currentReady = false
    this._pendingWhitespace = ''

    this._diagnostic(events, {
      code: 'unexpected-text',
      message: `Encountered text outside of a ■ block; recovered it into an implicit ■send=${this._recoveryComponent}`,
      itemId: item.id,
    })
    events.push({ type: 'item-start', item })
    this._ready(events)
    events.push({ type: 'body-start', itemId: item.id })
    this._state = 'body'
    this._appendBody(char)
  }

  private _diagnostic(events: MessageStreamEvent[], diagnostic: Diagnostic): void {
    if (diagnostic.itemId) {
      const item = this._items.find((i) => i.id === diagnostic.itemId)
      item?.diagnostics.push(diagnostic)
    }
    events.push({ type: 'diagnostic', diagnostic })
  }
}
