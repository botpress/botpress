/**
 * Micropatch v0.4
 *
 * A tiny engine to parse and apply ultra-compact line-based patches designed for LLMs.
 *
 * Protocol recap:
 * - Source lines are referenced by ORIGINAL 1-based numbers (pre-edit).
 * - Ops start at the beginning of a line with the marker `◼︎` (`◼` without the variation selector and `■` are
 *   accepted too, since models often drop or swap it).
 * - Allowed ops:
 *    ◼︎<NNN|text        → insert line(s) BEFORE original NNN (multiline payload allowed)
 *    ◼︎>NNN|text        → insert line(s) AFTER  original NNN (multiline payload allowed)
 *    ◼︎=NNN|line        → replace line NNN with one or more lines (multiline payload allowed)
 *    ◼︎=NNN-MMM|lines   → replace inclusive range NNN..MMM with one or more lines
 *    ◼︎-NNN             → delete line NNN
 *    ◼︎-NNN-MMM         → delete inclusive range NNN..MMM
 * - Multiline payload: starts after `|` and continues **until the next op line** or EOF. Trailing blank lines of a
 *   payload are dropped (they separate ops; insert an explicit empty line with `◼︎>NNN|` if needed).
 * - Only escaping rule: `\◼︎` inside payload/text becomes a literal `◼︎`. No other escaping is recognized.
 * - Ranges are allowed **only** for `-` (delete) and `=` (replace).
 * - Deterministic apply order on ORIGINAL addresses:
 *    1) Deletes `-` (desc by start)
 *    2) Single-line replaces `=NNN` (asc)
 *    3) Range replaces `=NNN-MMM` (asc by start)
 *    4) Inserts `<` (asc)
 *    5) Inserts `>` (asc)
 *
 * Notes:
 * - Every original line keeps its own slot (text inserted before it, its content, text inserted after it), so ORIGINAL
 *   references stay valid whatever the other ops do:
 *   - an insert next to a deleted line lands where that line was;
 *   - an insert after a replaced line lands after the whole replacement;
 *   - several inserts at the same line keep the order they were written in.
 * - Ops that can't apply (line past the end of the file, replacing or deleting a line another op already deleted or
 *   replaced) are skipped. `applyWithReport` lists them.
 * - Whitespace is preserved; EOL style can be chosen or auto-detected.
 */

export type EOL = 'lf' | 'crlf'

/** Parsed operations (internal normalized form). */
type Op =
  | { k: '<'; n: number; s: string[] } // insert before
  | { k: '>'; n: number; s: string[] } // insert after
  | { k: '='; n: number; s: string[] } // replace single line with N lines
  | { k: '=-'; a: number; b: number; s: string[] } // replace range with N lines
  | { k: '-'; n: number } // delete single
  | { k: '--'; a: number; b: number } // delete range

/** An op that was not applied, and why */
export type SkippedOp = {
  op: string
  reason: 'out_of_range' | 'conflict'
  message: string
}

/** The canonical marker: U+25FC + U+FE0E (text presentation) */
const MARKER = '◼︎'

/** Op header: the marker (any accepted variant), the op, the line(s) and an optional payload */
const HEADER_RE = /^[◼■][︎️]?([<>=-])(\d+)(?:-(\d+))?(?:\|(.*))?$/

/**
 * Micropatch: parse & apply patches to text.
 */
export class Micropatch {
  private _text: string
  private _eol: EOL

  /**
   * Create a Micropatch instance.
   * @param source The file contents.
   * @param eol Line ending style. If omitted, it is auto-detected from `source` (CRLF if any CRLF is present; otherwise LF).
   */
  public constructor(source: string, eol?: EOL) {
    this._text = source
    this._eol = eol ?? Micropatch.detectEOL(source)
  }

  /** Get current text. */
  public getText(): string {
    return this._text
  }

  /**
   * Replace current text.
   * Useful if you want to "load" a new snapshot without reconstructing the class.
   */
  public setText(source: string, eol?: EOL): void {
    this._text = source
    this._eol = eol ?? Micropatch.detectEOL(source)
  }

  /**
   * Apply ops text to current buffer.
   * @param opsText One or more operations in the v0.4 syntax.
   * @returns The updated text (also stored internally).
   * @throws If the patch contains invalid syntax (e.g., range on insert).
   */
  public apply(opsText: string): string {
    const ops = Micropatch.parseOps(opsText)
    this._text = Micropatch._applyOps(this._text, ops, this._eol).text
    return this._text
  }

  /**
   * Render a numbered view of the current buffer (token-cheap preview for models).
   * Format: `NNN|<line>`, starting at 001.
   */
  public renderNumberedView(): string {
    const NL = this._eol === 'lf' ? '\n' : '\r\n'
    const lines = Micropatch._splitEOL(this._text)
    return lines.map((l, i) => `${String(i + 1).padStart(3, '0')}|${l}`).join(NL)
  }

  // ---------------------- Static helpers ----------------------

  /** Detect EOL style from content. */
  public static detectEOL(source: string): EOL {
    return /\r\n/.test(source) ? 'crlf' : 'lf'
  }

  /** Number of addressable lines in `source` (what the numbered view shows). */
  public static lineCount(source: string): number {
    return Micropatch._splitEOL(source).length
  }

  /** Split text into lines, preserving empty last line if present. */
  private static _splitEOL(text: string): string[] {
    // If text ends with NL, split leaves an extra empty string we want to keep.
    return text.split(/\r?\n/)
  }

  /** Join lines with the chosen EOL. */
  private static _joinEOL(lines: string[], eol: EOL): string {
    const NL = eol === 'lf' ? '\n' : '\r\n'
    return lines.join(NL)
  }

  /** Unescape payload text: `\◼︎` → `◼︎`. */
  private static _unescapeMarker(s: string): string {
    return s.replace(/\\◼︎/g, MARKER)
  }

  /** Whether a line starts a new op */
  private static _isOpLine(line: string): boolean {
    return line.startsWith(MARKER) || HEADER_RE.test(line)
  }

  /**
   * Parse ops text (v0.4).
   * - Ignores blank lines and non-op lines before the first op (you can keep comments there).
   * - Validates ranges for allowed ops.
   */
  public static parseOps(opsText: string): Op[] {
    const lines = opsText.split(/\r?\n/)
    const ops: Op[] = []

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        continue
      }

      if (!Micropatch._isOpLine(line)) {
        i++
        continue // ignore non-op lines
      }

      const m = HEADER_RE.exec(line)
      if (!m || !m[1] || !m[2]) {
        throw new Error(`Invalid op syntax at line ${i + 1}: ${line}`)
      }

      const op = m[1] as '<' | '>' | '=' | '-'
      const aNum = parseInt(m[2], 10)
      const bNum = m[3] ? parseInt(m[3], 10) : undefined
      // LLMs sometimes "double" the leading `|` of a payload that itself begins with `|`
      // (e.g. markdown table rows), as if escaping it. The protocol has no such escape,
      // so a payload starting with `||` is treated as a single literal leading `|`.
      const firstPayload = (m[4] ?? '').replace(/^\|\|/, '|')

      if (aNum < 1 || (bNum !== undefined && bNum < aNum)) {
        throw new Error(`Invalid line/range at line ${i + 1}: ${line}`)
      }

      // Deletes: may be single or range; no payload allowed.
      if (op === '-') {
        if (firstPayload !== '') {
          throw new Error(`Delete must not have a payload (line ${i + 1})`)
        }
        if (bNum === undefined) {
          ops.push({ k: '-', n: aNum })
        } else {
          ops.push({ k: '--', a: aNum, b: bNum })
        }
        i++
        continue
      }

      if ((op === '<' || op === '>') && bNum !== undefined) {
        throw new Error(`Insert cannot target a range (line ${i + 1})`)
      }

      // Inserts and replaces: MULTILINE payload, until the next op line or EOF.
      const payload: string[] = [Micropatch._unescapeMarker(firstPayload)]
      let j = i + 1
      while (j < lines.length) {
        const nextLine = lines[j]!
        if (Micropatch._isOpLine(nextLine)) break
        payload.push(Micropatch._unescapeMarker(nextLine))
        j++
      }
      // Blank lines between ops (or at the end of the patch) are separators, not content
      while (payload.length > 1 && payload[payload.length - 1] === '') {
        payload.pop()
      }

      if (op === '<' || op === '>') {
        ops.push({ k: op, n: aNum, s: payload })
      } else if (bNum === undefined) {
        ops.push({ k: '=', n: aNum, s: payload })
      } else {
        ops.push({ k: '=-', a: aNum, b: bNum, s: payload })
      }
      i = j
    }

    return Micropatch._canonicalizeOrder(ops)
  }

  /** Order ops deterministically according to the spec. */
  private static _canonicalizeOrder(ops: Op[]): Op[] {
    const delS: Array<Extract<Op, { k: '-' }>> = []
    const delR: Array<Extract<Op, { k: '--' }>> = []
    const eqS: Array<Extract<Op, { k: '=' }>> = []
    const eqR: Array<Extract<Op, { k: '=-' }>> = []
    const insB: Array<Extract<Op, { k: '<' }>> = []
    const insA: Array<Extract<Op, { k: '>' }>> = []

    for (const o of ops) {
      switch (o.k) {
        case '-':
          delS.push(o)
          break
        case '--':
          delR.push(o)
          break
        case '=':
          eqS.push(o)
          break
        case '=-':
          eqR.push(o)
          break
        case '<':
          insB.push(o)
          break
        case '>':
          insA.push(o)
          break
        default:
          break
      }
    }

    // Stable sorts: inserts at the same line keep the order they were written in
    delS.sort((a, b) => b.n - a.n)
    delR.sort((a, b) => b.a - a.a)
    eqS.sort((a, b) => a.n - b.n)
    eqR.sort((a, b) => a.a - b.a)
    insB.sort((a, b) => a.n - b.n)
    insA.sort((a, b) => a.n - b.n)

    return ([] as Op[]).concat(delS, delR, eqS, eqR, insB, insA)
  }

  private static _describe(o: Op): string {
    switch (o.k) {
      case '-':
        return `${MARKER}-${o.n}`
      case '--':
        return `${MARKER}-${o.a}-${o.b}`
      case '=':
        return `${MARKER}=${o.n}`
      case '=-':
        return `${MARKER}=${o.a}-${o.b}`
      default:
        return `${MARKER}${o.k}${o.n}`
    }
  }

  /**
   * Apply normalized ops to given source.
   * - Every ORIGINAL line has a slot: lines inserted before it, its content (empty once deleted), lines inserted after it.
   * - Skips ops whose targets don't exist or were already deleted/replaced, and reports them.
   */
  private static _applyOps(source: string, ops: Op[], eol: EOL): { text: string; skipped: SkippedOp[] } {
    const original = Micropatch._splitEOL(source)
    const count = original.length
    const slots = original.map((line) => ({
      before: [] as string[],
      content: [line],
      after: [] as string[],
      state: 'original' as 'original' | 'deleted' | 'replaced',
    }))
    const skipped: SkippedOp[] = []

    const outOfRange = (o: Op, n: number) =>
      skipped.push({
        op: Micropatch._describe(o),
        reason: 'out_of_range',
        message: `${Micropatch._describe(o)} targets line ${n}, but the file only has ${count} line(s)`,
      })
    const conflict = (o: Op, n: number) =>
      skipped.push({
        op: Micropatch._describe(o),
        reason: 'conflict',
        message: `${Micropatch._describe(o)} targets line ${n}, which another op already ${slots[n - 1]!.state}`,
      })

    for (const o of ops) {
      switch (o.k) {
        case '-': {
          if (o.n > count) {
            outOfRange(o, o.n)
            break
          }
          const slot = slots[o.n - 1]!
          if (slot.state === 'deleted') {
            break // deleting a line twice is harmless
          }
          if (slot.state !== 'original') {
            conflict(o, o.n)
            break
          }
          slot.content = []
          slot.state = 'deleted'
          break
        }
        case '--': {
          if (o.a > count) {
            outOfRange(o, o.a)
            break
          }
          if (o.b > count) {
            outOfRange(o, o.b) // reported, but the lines that do exist are deleted
          }
          for (let n = o.a; n <= Math.min(o.b, count); n++) {
            const slot = slots[n - 1]!
            slot.content = []
            slot.state = 'deleted'
          }
          break
        }
        case '=': {
          if (o.n > count) {
            outOfRange(o, o.n)
            break
          }
          const slot = slots[o.n - 1]!
          if (slot.state !== 'original') {
            conflict(o, o.n)
            break
          }
          slot.content = [...o.s]
          slot.state = 'replaced'
          break
        }
        case '=-': {
          if (o.a > count) {
            outOfRange(o, o.a)
            break
          }
          const b = Math.min(o.b, count)
          if (o.b > count) {
            outOfRange(o, o.b) // reported, but the lines that do exist are replaced
          }
          const clash = slots.slice(o.a - 1, b).findIndex((slot) => slot.state === 'replaced')
          if (clash >= 0 || slots[o.a - 1]!.state === 'deleted') {
            conflict(o, clash >= 0 ? o.a + clash : o.a)
            break
          }
          for (let n = o.a; n <= b; n++) {
            const slot = slots[n - 1]!
            slot.content = n === o.a ? [...o.s] : []
            slot.state = n === o.a ? 'replaced' : 'deleted'
          }
          break
        }
        case '<': {
          if (o.n > count) {
            outOfRange(o, o.n)
            break
          }
          slots[o.n - 1]!.before.push(...o.s)
          break
        }
        case '>': {
          if (o.n > count) {
            outOfRange(o, o.n)
            break
          }
          slots[o.n - 1]!.after.push(...o.s)
          break
        }
        default:
          break
      }
    }

    const lines = slots.flatMap((slot) => [...slot.before, ...slot.content, ...slot.after])
    return { text: Micropatch._joinEOL(lines, eol), skipped }
  }

  // ---------------------- Convenience APIs ----------------------

  /**
   * Convenience: one-shot apply.
   * @param source Text to patch.
   * @param opsText Operations text.
   * @param eol EOL style (auto-detected if omitted).
   */
  public static applyText(source: string, opsText: string, eol?: EOL): string {
    const inst = new Micropatch(source, eol)
    return inst.apply(opsText)
  }

  /**
   * One-shot apply that also reports the ops that were skipped (line out of range, or line already deleted/replaced).
   * @throws If the patch contains invalid syntax.
   */
  public static applyWithReport(
    source: string,
    opsText: string,
    eol?: EOL
  ): { text: string; skipped: SkippedOp[]; count: number } {
    const ops = Micropatch.parseOps(opsText)
    const result = Micropatch._applyOps(source, ops, eol ?? Micropatch.detectEOL(source))
    return { ...result, count: ops.length }
  }

  /**
   * Convenience: parse only.
   * Useful for validation without applying.
   */
  public static validate(opsText: string): { ok: true; count: number } {
    const ops = Micropatch.parseOps(opsText)
    return { ok: true, count: ops.length }
  }
}
