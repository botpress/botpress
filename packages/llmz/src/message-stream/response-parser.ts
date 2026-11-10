import type { StopReason } from '@botpress/cognitive'
import { hasTopLevelReturn } from '../compiler/index.js'
import { StreamingMessageParser } from './parser.js'
import type { Diagnostic, MessageStreamEvent, ParsedItem } from './types.js'

/**
 * Text a model may write before ■start. Some models stream junk for minutes
 * without ever opening the envelope; past this many characters, give up.
 */
export const MAX_PREAMBLE_LENGTH = 8_000

/** Text a model may write after ■end before the rest of its stream is ignored. */
export const MAX_TRAILER_LENGTH = 2_000

/** One wire format: a complete ■start … ■end envelope containing valid blocks. */
export class ResponseParser {
  private _parser = new StreamingMessageParser()
  private _mode: 'detect' | 'framed' = 'detect'
  private _discardPrefixLine = false
  private _prefixDiagnostics: Diagnostic[] = []
  private _prefix = ''
  private _boundary = ''
  private _closed = false
  private _finished = false
  private _failure: Diagnostic | undefined
  private _trailer = ''
  private _preambleLength = 0

  public get framed(): boolean {
    return this._mode === 'framed'
  }

  /** Whether ■end was received. Later text is only kept as a diagnostic. */
  public get closed(): boolean {
    return this._closed
  }

  /** The model is writing junk past either boundary: stop reading the stream. */
  public get done(): boolean {
    if (this._closed) return this._trailer.length > MAX_TRAILER_LENGTH
    return this._mode === 'detect' && this._preambleLength > MAX_PREAMBLE_LENGTH
  }

  public get valid(): boolean {
    return this._finished && this._closed && !this._failure
  }

  public get items(): ParsedItem[] {
    return this.valid ? this._parser.items : []
  }

  public get diagnostics(): Diagnostic[] {
    return [
      ...this._prefixDiagnostics,
      ...this._parser.diagnostics,
      ...this._trailingDiagnostics,
      ...(this._failure ? [this._failure] : []),
    ]
  }

  public push(chunk: string): MessageStreamEvent[] {
    if (this._finished) throw new Error('Response parser has already finished')
    const events: MessageStreamEvent[] = []
    let forward = ''
    const flush = () => {
      if (forward) events.push(...this._parser.push(forward))
      forward = ''
    }
    for (const char of chunk) {
      if (this._closed) {
        this._trailer += char
        continue
      }
      if (this.done) continue
      if (this._mode === 'detect') {
        this._preambleLength++
        if (this._discardPrefixLine) {
          if (char === '\n') this._discardPrefixLine = false
          continue
        }
        if (!this._prefix && /\s/.test(char)) continue
        this._prefix += char
        const trimmed = this._prefix.trimEnd()
        if (char === '\n' && trimmed === '"""') {
          events.push(...this._parser.push(this._prefix))
          this._prefix = ''
        } else if (char === '\n' && trimmed === '■start') {
          this._mode = 'framed'
          this._prefix = ''
        } else if (
          !'■start'.startsWith(this._prefix) &&
          !/^■start[ \t\r]*$/.test(this._prefix) &&
          !/^"{1,3}[ \t\r]*$/.test(this._prefix)
        ) {
          // Ignore everything before a standalone start marker, including apparent
          // send/run blocks in a thinking preamble. Never feed it to the block parser.
          if (!this._prefixDiagnostics.length) {
            const diagnostic: Diagnostic = { code: 'unexpected-text', message: 'Discarded text before ■start' }
            this._prefixDiagnostics.push(diagnostic)
            events.push({ type: 'diagnostic', diagnostic })
          }
          this._prefix = ''
          this._discardPrefixLine = char !== '\n'
        }
        continue
      }
      if (this._boundary || char === '■') {
        this._boundary += char
        if (this._boundary === '■end') {
          // The first complete end marker is authoritative, including when the
          // provider emits ■end■start in one chunk. Never parse its suffix.
          flush()
          events.push(...this._parser.finish())
          this._boundary = ''
          this._closed = true
        } else if (!'■end'.startsWith(this._boundary)) {
          forward += this._boundary
          this._boundary = ''
        }
      } else {
        forward += char
      }
    }
    flush()
    return events
  }

  public finish(stopReason?: StopReason): MessageStreamEvent[] {
    if (this._finished) return []
    this._finished = true
    const events: MessageStreamEvent[] = []
    if (this._mode === 'detect') {
      if (this.done) this._fail(`Missing ■start: no response envelope within ${MAX_PREAMBLE_LENGTH} characters`)
      else if (this._prefix.trim() === '■start') this._mode = 'framed'
      else this._fail('Missing ■start: every response must begin with the response envelope')
      this._prefix = ''
    }
    if (this.framed) {
      // Cognitive/provider STOP consumes ■end. A normal successful stop can
      // close the envelope; a truncation, failure, or partial marker cannot.
      if (!this._boundary && stopReason === 'stop') this._closed = true
      else if (this._boundary) events.push(...this._parser.push(this._boundary))
      events.push(...this._parser.finish())
      const trailer = this._trailer.trim()
      if (!this._closed) this._fail('Missing ■end: the response envelope is incomplete')
      else if (this._parser.diagnostics.some((d) => d.code !== 'example-delimiter')) {
        this._fail('The response envelope contains malformed protocol blocks')
      }
      if (!this._failure) this._validateBlocks()
      if (trailer === '"""') {
        // Copied documentation quotes are removed before any customer callback.
        const parser = new StreamingMessageParser()
        events.push(...parser.push(trailer), ...parser.finish())
        this._trailingDiagnostics = parser.diagnostics
      } else if (trailer) {
        const diagnostic: Diagnostic = { code: 'unexpected-text', message: 'Discarded content after ■end' }
        this._trailingDiagnostics.push(diagnostic)
        events.push({ type: 'diagnostic', diagnostic })
      }
      if (this._failure) events.push({ type: 'diagnostic', diagnostic: this._failure })
    } else if (this._failure) {
      events.push({ type: 'diagnostic', diagnostic: this._failure })
    }
    return events
  }

  private _trailingDiagnostics: Diagnostic[] = []

  private _validateBlocks(): void {
    const items = this._parser.items
    const runs = items.filter((item) => item.kind === 'run')
    const next = items.findIndex((item) => item.kind === 'next')
    const run = items.findIndex((item) => item.kind === 'run')
    if (runs.length > 1 || (run >= 0 && items.slice(run + 1).some((item) => item.kind === 'send'))) {
      this._fail('Use at most one ■run, after all messages; never send a message after code')
    } else if (run >= 0 && hasTopLevelReturn(items[run]!.body ?? '')) {
      if (run !== items.length - 1) this._fail('After code returning a result, write ■end and wait for the result')
    } else if (next < 0 && run < 0) {
      this._fail('Finish with ■next, or return a result from ■run for the next iteration')
    }
  }

  private _fail(message: string): void {
    this._failure = { code: 'invalid-envelope', message }
  }
}
