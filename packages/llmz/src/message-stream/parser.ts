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
      // Some models repeat the props braces: {{"number":17}}. Accept only
      // a complete object inside one extra pair; never guess missing values.
      const trimmed = text.trim()
      if (/^\{\s*\{/.test(trimmed) && /\}\s*\}$/.test(trimmed)) {
        try {
          return JSON5.parse(trimmed.slice(1, -1))
        } catch {
          // Other malformed objects still use the normal invalid-props path.
        }
      }

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
 * Text outside protocol blocks is always discarded with a diagnostic; only
 * explicit `■send` blocks can produce messages.
 *
 * Pushing the same text split across arbitrary chunk boundaries always produces
 * the same items and the same concatenated body deltas. For a higher-level
 * `AsyncIterable` API, see `stream.ts`.
 */
export class StreamingMessageParser {
  private _maxPropsLength: number

  private _state: ParserState = 'idle'
  private _items: ParsedItem[] = []
  private _diagnostics: Diagnostic[] = []
  private _current: ParsedItem | undefined
  private _currentReady = false
  private _counter = 0
  private _finished = false
  private _ended = false

  private _directiveBuffer = ''
  private _nameBuffer = ''

  private _propsBuffer = ''
  private _propsDepth = 0
  private _quoteChar: '"' | "'" | undefined
  private _escaped = false
  private _propsBroken = false

  private _bodyDelta = ''
  private _pendingWhitespace = ''
  // When recovering from unformatted leading text, a marker mentioned in prose
  // is not a block. Wait for a complete header before emitting any item events.
  private _preambleHeader: string | undefined
  // A closing Markdown fence after a completed exit is wrapper noise, never a body.
  private _closingFenceTicks: number | undefined
  private _lineStart = true
  // Hold possible documentation delimiters BEFORE producing any body deltas.
  private _exampleDelimiter = ''

  public constructor(options: StreamingParserOptions = {}) {
    this._maxPropsLength = options.maxPropsLength ?? 100_000
  }

  /** All items parsed so far, in order of appearance. */
  public get items(): ParsedItem[] {
    return [...this._items]
  }

  /** All syntax diagnostics, including discarded text that has no protocol item. */
  public get diagnostics(): Diagnostic[] {
    return [...this._diagnostics]
  }

  public push(chunk: string): MessageStreamEvent[] {
    if (this._finished) {
      throw new Error('Parser has already finished. Call reset() before parsing a new stream.')
    }

    const events: MessageStreamEvent[] = []
    for (const char of chunk) {
      this._processOutputChar(char, events)
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
    if (/^"""\s*$/.test(this._exampleDelimiter)) {
      this._discardExampleDelimiter(events)
    } else if (reason === 'end') {
      this._flushExampleDelimiter(events)
    } else {
      // A cut-off delimiter must not flash in an interrupted message either.
      this._exampleDelimiter = ''
    }
    if (this._closingFenceTicks !== undefined && this._closingFenceTicks !== 3) {
      this._skipUnexpectedText(events)
    }

    this._closingFenceTicks = undefined
    const status: ItemStatus | undefined = reason === 'interrupted' ? 'interrupted' : undefined

    if (this._state === 'skip' && this._preambleHeader) {
      this._recoverPreambleHeader(events)
    }

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
    this._diagnostics = []
    this._current = undefined
    this._currentReady = false
    this._counter = 0
    this._finished = false
    this._ended = false
    this._directiveBuffer = ''
    this._nameBuffer = ''
    this._propsBuffer = ''
    this._propsDepth = 0
    this._quoteChar = undefined
    this._escaped = false
    this._propsBroken = false
    this._bodyDelta = ''
    this._pendingWhitespace = ''
    this._preambleHeader = undefined
    this._closingFenceTicks = undefined
    this._lineStart = true
    this._exampleDelimiter = ''
  }

  private _processOutputChar(char: string, events: MessageStreamEvent[]): void {
    const lineStart = this._lineStart
    this._lineStart = char === '\n' || (lineStart && (char === ' ' || char === '\t' || char === '\r'))

    if (this._exampleDelimiter) {
      // Inside a body, only remove a terminal delimiter. Interior lines may be
      // literal Markdown/code content and must stay intact.
      if (this._exampleDelimiter.includes('\n')) {
        if (isWhitespace(char)) {
          this._exampleDelimiter += char
          return
        }
        if (char === MARKER) {
          this._discardExampleDelimiter(events)
        } else {
          this._flushExampleDelimiter(events)
        }
      } else {
        const candidate = this._exampleDelimiter + char
        if (/^(?:"{1,2}|"""[ \t]*\r?)$/.test(candidate)) {
          this._exampleDelimiter = candidate
          return
        }
        if (/^"""[ \t]*\r?\n$/.test(candidate)) {
          this._exampleDelimiter = candidate
          if (this._state !== 'body') this._discardExampleDelimiter(events)
          return
        }
        this._flushExampleDelimiter(events)
      }
    }

    if (
      lineStart &&
      char === '"' &&
      (this._state === 'idle' || this._state === 'skip' || this._state === 'body-wait' || this._state === 'body')
    ) {
      this._exampleDelimiter = char
      return
    }
    this._processChar(char, events)
  }

  private _flushExampleDelimiter(events: MessageStreamEvent[]): void {
    for (const char of this._exampleDelimiter) this._processChar(char, events)
    this._exampleDelimiter = ''
  }

  private _discardExampleDelimiter(events: MessageStreamEvent[]): void {
    this._exampleDelimiter = ''
    this._diagnostic(events, {
      code: 'example-delimiter',
      message: 'Discarded a triple-quote example delimiter',
    })
  }

  private _processChar(char: string, events: MessageStreamEvent[]): void {
    if (this._closingFenceTicks !== undefined) {
      if (char === '`' && this._closingFenceTicks < 3) {
        this._closingFenceTicks++
        return
      }

      if (isWhitespace(char) && this._closingFenceTicks === 3) {
        return
      }

      this._closingFenceTicks = undefined
      this._skipUnexpectedText(events)
    }

    // An exit terminates this response. Never emit later sends or execute later
    // code, even if the model repeats an otherwise valid response after it.
    if (this._ended) {
      if (this._state === 'skip' || isWhitespace(char)) return
      if (char === '`') {
        this._closingFenceTicks = 1
        return
      }
      this._skipUnexpectedText(events)
      return
    }

    switch (this._state) {
      case 'idle': {
        if (char === MARKER) {
          this._beginItem(events)
        } else if (!isWhitespace(char)) {
          const last = this._items.at(-1)
          if (char === '`' && last?.kind === 'next' && last.status === 'complete') {
            this._closingFenceTicks = 1
            return
          }
          this._skipUnexpectedText(events)

          if (!this._items.length) {
            this._preambleHeader = ''
          }
        }
        return
      }

      case 'directive': {
        if (char === '=') {
          this._endDirective(events, '=')
        } else if (char === MARKER) {
          this._endDirective(events, undefined)
          this._completeCurrent(events)
          this._beginItem(events)
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
          this._beginItem(events)
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
          this._beginItem(events)
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
          this._beginItem(events)
        } else {
          this._appendBody(char)
        }
        return
      }

      case 'skip': {
        if (this._preambleHeader !== undefined) {
          if (char === MARKER) {
            this._preambleHeader = MARKER
          } else if (this._preambleHeader) {
            this._preambleHeader += char

            if (char === '\n') {
              this._recoverPreambleHeader(events)
            } else if (this._preambleHeader.length > this._maxPropsLength) {
              // Bound malformed header buffering just like props buffering.
              this._preambleHeader = ''
            }
          }
          return
        }
        if (char === MARKER) {
          this._beginItem(events)
        }
        return
      }
    }
  }

  private _recoverPreambleHeader(events: MessageStreamEvent[]): void {
    const header = this._preambleHeader ?? ''

    // A real run header is alone on its line. For sends/exits allow inline
    // props, but not prose such as "we need a ■run block with the query".
    if (/^■(?:run|(?:send|next)=[a-z][a-z0-9_-]*(?:[ \t]*\{[^\r\n]*\})?)[ \t]*\r?\n?$/i.test(header)) {
      this._preambleHeader = undefined
      this._state = 'idle'

      for (const char of header) {
        this._processChar(char, events)
      }
    } else {
      this._preambleHeader = ''
    }
  }

  /** Handles a character on the header line, after the directive and name have been parsed. */
  private _afterHeaderChar(char: string, events: MessageStreamEvent[]): void {
    const item = this._current!

    if (char === MARKER) {
      this._completeCurrent(events)
      this._beginItem(events)
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
      // Free text after a completed ■next header: finish the item, discard the text
      this._completeCurrent(events)
      this._skipUnexpectedText(events)
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
        this._beginItem(events)
      }
      return
    }

    if (char === '"' || char === "'") {
      this._quoteChar = char
    } else if (char === MARKER) {
      // `■` is never valid outside of a string
      this._failProps(events, 'props were interrupted by a new block')
      this._completeCurrent(events)
      this._beginItem(events)
    } else if (char === '{' || char === '[') {
      this._propsDepth++
    } else if (char === '}' || char === ']') {
      this._propsDepth--
      if (this._propsDepth <= 0) {
        this._endProps(events)
      }
    }
  }

  private _beginItem(events: MessageStreamEvent[]): void {
    if (this._ended) {
      this._skipUnexpectedText(events)
      return
    }
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

    if (item.kind === 'next' && item.status === 'complete') this._ended = true

    events.push({ type: 'item-complete', item })
    this._current = undefined
    this._currentReady = false
  }

  private _skipUnexpectedText(events: MessageStreamEvent[]): void {
    this._diagnostic(events, {
      code: 'unexpected-text',
      message: this._ended ? 'Discarded content after terminal ■next' : 'Encountered text outside of a ■ block',
    })
    this._state = 'skip'
  }

  private _diagnostic(events: MessageStreamEvent[], diagnostic: Diagnostic): void {
    this._diagnostics.push(diagnostic)
    if (diagnostic.itemId) {
      const item = this._items.find((i) => i.id === diagnostic.itemId)
      item?.diagnostics.push(diagnostic)
    }
    events.push({ type: 'diagnostic', diagnostic })
  }
}
