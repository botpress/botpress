/**
 * Micropatch v0.3
 *
 * A tiny engine to parse and apply ultra-compact line-based patches designed for LLMs.
 *
 * Protocol recap:
 * - Source lines are referenced by ORIGINAL 1-based numbers (pre-edit).
 * - Ops start at the beginning of a line with the marker `◼︎`.
 * - Allowed ops:
 *    ◼︎<NNN|text        → insert single line BEFORE original NNN
 *    ◼︎>NNN|text        → insert single line AFTER  original NNN
 *    ◼︎=NNN|line        → replace line NNN with one or more lines (multiline payload allowed)
 *    ◼︎=NNN-MMM|lines   → replace inclusive range NNN..MMM with one or more lines
 *    ◼︎-NNN             → delete line NNN
 *    ◼︎-NNN-MMM         → delete inclusive range NNN..MMM
 * - Multiline `=` payload: starts after `|` and continues **until the next line that begins with `◼︎`** or EOF.
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
 * - The engine maintains a live index map so ORIGINAL references remain valid despite shifting.
 * - Idempotency-friendly: if a target original line no longer maps into current text (e.g., already deleted), the op is skipped.
 * - Whitespace is preserved; EOL style can be chosen or auto-detected.
 */

export type EOL = 'lf' | 'crlf'

/** Parsed operations (internal normalized form). */
type Op =
  | { k: '<'; n: number; s: string } // insert before (single-line)
  | { k: '>'; n: number; s: string } // insert after (single-line)
  | { k: '='; n: number; s: string[] } // replace single line with N lines
  | { k: '=-'; a: number; b: number; s: string[] } // replace range with N lines
  | { k: '-'; n: number } // delete single
  | { k: '--'; a: number; b: number } // delete range

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
   * @param opsText One or more operations in the v0.3 syntax.
   * @returns The updated text (also stored internally).
   * @throws If the patch contains invalid syntax (e.g., range on insert).
   */
  public apply(opsText: string): string {
    const ops = Micropatch.parseOps(opsText)
    this._text = Micropatch._applyOps(this._text, ops, this._eol)
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

  /** Split text into lines, preserving empty last line if present. */
  private static _splitEOL(text: string): string[] {
    // Use universal split, but keep trailing empty line if final NL exists.
    const parts = text.split(/\r?\n/)
    // If text ends with NL, split leaves an extra empty string we want to keep.
    return parts
  }

  /** Join lines with the chosen EOL. */
  private static _joinEOL(lines: string[], eol: EOL): string {
    const NL = eol === 'lf' ? '\n' : '\r\n'
    return lines.join(NL)
  }

  /** Unescape payload text: `\◼︎` → `◼︎`. */
  private static _unescapeMarker(s: string): string {
    return s.replace(/\\◼︎/g, '◼︎')
  }

  /**
   * Parse ops text (v0.3).
   * - Ignores blank lines and lines not starting with `◼︎` (you can keep comments elsewhere).
   * - Validates ranges for allowed ops.
   */
  public static parseOps(opsText: string): Op[] {
    const lines = opsText.split(/\r?\n/)
    const ops: Op[] = []

    // Regex for op header line:
    // ◼︎([<>=-])(\d+)(?:-(\d+))?(?:\|(.*))?$
    const headerRe = /^◼︎([<>=-])(\d+)(?:-(\d+))?(?:\|(.*))?$/

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (!line) {
        i++
        continue
      }

      if (!line.startsWith('◼︎')) {
        i++
        continue // ignore non-op lines
      }

      const m = headerRe.exec(line)
      if (!m || !m[1] || !m[2]) {
        throw new Error(`Invalid op syntax at line ${i + 1}: ${line}`)
      }

      const op = m[1] as '<' | '>' | '=' | '-'
      const aNum = parseInt(m[2], 10)
      const bNum = m[3] ? parseInt(m[3], 10) : undefined
      const firstPayload = m[4] ?? ''

      if (aNum < 1 || (bNum !== undefined && bNum < aNum)) {
        throw new Error(`Invalid line/range at line ${i + 1}: ${line}`)
      }

      // Inserts: single-line payload only; ranges are illegal.
      if (op === '<' || op === '>') {
        if (bNum !== undefined) {
          throw new Error(`Insert cannot target a range (line ${i + 1})`)
        }
        const text = Micropatch._unescapeMarker(firstPayload)
        ops.push({ k: op, n: aNum, s: text })
        i++
        continue
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

      // Replaces: '=' supports single or range, and MULTILINE payload.
      if (op === '=') {
        // Collect multiline payload until next line starting with '◼︎' or EOF.
        const payload: string[] = [Micropatch._unescapeMarker(firstPayload)]
        let j = i + 1
        while (j < lines.length) {
          const nextLine = lines[j]
          if (!nextLine || nextLine.startsWith('◼︎')) break
          payload.push(Micropatch._unescapeMarker(nextLine))
          j++
        }
        // Normalize potential trailing empty due to splitting; keep as-is (exact payload).
        if (bNum === undefined) {
          ops.push({ k: '=', n: aNum, s: payload })
        } else {
          ops.push({ k: '=-', a: aNum, b: bNum, s: payload })
        }
        i = j
        continue
      }

      // Should be unreachable.
      i++
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

    delS.sort((a, b) => b.n - a.n)
    delR.sort((a, b) => b.a - a.a)
    eqS.sort((a, b) => a.n - b.n)
    eqR.sort((a, b) => a.a - b.a)
    insB.sort((a, b) => a.n - b.n)
    insA.sort((a, b) => a.n - b.n)

    return ([] as Op[]).concat(delS, delR, eqS, eqR, insB, insA)
  }

  /**
   * Apply normalized ops to given source.
   * - Uses a live index map from ORIGINAL 1-based addresses → current positions.
   * - Skips ops whose targets can no longer be mapped (idempotency-friendly).
   */
  private static _applyOps(source: string, ops: Op[], eol: EOL): string {
    const lines = Micropatch._splitEOL(source)

    // idx[i] = current position (0-based) of original line (i+1).
    const idx: number[] = Array.from({ length: lines.length }, (_, i) => i)

    const map = (n: number): number => idx[n - 1] ?? -1
    const bump = (from: number, delta: number) => {
      // Shift all tracked indices at or after `from` by delta.
      for (let i = 0; i < idx.length; i++) {
        const current = idx[i]
        if (current !== undefined && current >= from) {
          idx[i] = current + delta
        }
      }
    }

    for (const o of ops) {
      switch (o.k) {
        case '-': {
          const i = map(o.n)
          if (i >= 0 && i < lines.length) {
            lines.splice(i, 1)
            bump(i, -1)
          }
          break
        }
        case '--': {
          const a = map(o.a)
          const b = map(o.b)
          if (a >= 0 && b >= a && b < lines.length) {
            lines.splice(a, b - a + 1)
            bump(a, -(b - a + 1))
          }
          break
        }
        case '=': {
          const i = map(o.n)
          if (i >= 0 && i < lines.length) {
            const rep = o.s
            lines.splice(i, 1, ...rep)
            bump(i + 1, rep.length - 1)
          }
          break
        }
        case '=-': {
          const a = map(o.a)
          const b = map(o.b)
          if (a >= 0 && b >= a && b < lines.length) {
            const rep = o.s
            lines.splice(a, b - a + 1, ...rep)
            bump(a + 1, rep.length - (b - a + 1))
          }
          break
        }
        case '<': {
          const i = Math.max(0, Math.min(map(o.n), lines.length))
          if (i >= 0) {
            lines.splice(i, 0, o.s)
            bump(i, +1)
          }
          break
        }
        case '>': {
          const i = Math.max(0, Math.min(map(o.n) + 1, lines.length))
          if (i >= 0) {
            lines.splice(i, 0, o.s)
            bump(i, +1)
          }
          break
        }
        default:
          break
      }
    }

    return Micropatch._joinEOL(lines, eol)
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
   * Convenience: parse only.
   * Useful for validation without applying.
   */
  public static validate(opsText: string): { ok: true; count: number } {
    const ops = Micropatch.parseOps(opsText)
    return { ok: true, count: ops.length }
  }
}
