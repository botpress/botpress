export type Citation = {
  id: number
  source: any
  tag: string
  offset?: number // Optional offset for the citation in the content
}

export type CitationReplaceFn = (citation: Citation) => string

/** These are all single-token symbols that are very rare in natural texts, making them suitable for usage within GPT Prompts. */
export const RARE_SYMBOLS = {
  ARROW_UP: '↑',
  CIRCLE_BULLET: '・',
  STAR_BULLET_FULL: '★',
  STAR_BULLET_EMPTY: '☆',
  ARROW_BULLET: '→',
  SQUARE_BULLET: '■',
  TRIANGLE_BULLET: '►',
  OPENING_TAG: '【',
  CLOSING_TAG: '】',
  SS: '§',
  CROSS: '†',
} as const

export class CitationsManager {
  private _citations: Map<number, Citation> = new Map()
  private _nextId: number = 0

  /**
   * Registers a new source and returns the created Citation.
   * @param source An object representing the source of the citation.
   * @returns The created Citation.
   */
  public registerSource(source: any): Citation {
    const id = this._nextId++
    const tag = `${RARE_SYMBOLS.OPENING_TAG}${id}${RARE_SYMBOLS.CLOSING_TAG}`
    const citation: Citation = {
      id,
      source,
      tag,
    }
    this._citations.set(id, citation)
    return citation
  }

  /**
   * Extracts citations from the provided content and cleans the content of citation tags.
   * Non-found citations are replaced with a special "Not Found" citation.
   * @param content The string content containing citation tags.
   * @returns An object containing the cleaned content and an array of found citations.
   */
  public extractCitations(content: string, replace?: CitationReplaceFn): { cleaned: string; citations: Citation[] } {
    const citations: Citation[] = []
    const notFoundCitation: Citation = {
      id: -1,
      source: 'Not Found',
      tag: '',
    }

    const regex = new RegExp(`${RARE_SYMBOLS.OPENING_TAG}([\\d|\\w|\\s|,]{0,})${RARE_SYMBOLS.CLOSING_TAG}`, 'ig')
    let match: RegExpExecArray | null
    const offsets: { start: number; length: number }[] = []

    while ((match = regex.exec(content)) !== null) {
      const offset = match.index
      const length = match[0].length
      offsets.push({ start: offset, length })

      const multi = (match[1] ?? '')
        .split(/\D/g)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => parseInt(s, 10))
        .filter((s) => !isNaN(s) && s >= 0)

      for (const citationId of multi) {
        const citation = this._citations.get(citationId)

        if (citation) {
          citations.push({ ...citation, offset })
        } else {
          citations.push({ ...notFoundCitation, offset })
        }
      }
    }

    // Replacement pass — use `content`, not `cleaned`, to avoid misaligned offsets
    const entries = offsets
      .map((o) => ({
        start: o.start,
        length: o.length,
        citations: citations.filter((x) => x.offset === o.start && x.id !== -1),
      }))
      .sort((a, b) => a.start - b.start)

    let result = ''
    let cursor = 0

    for (const { start, length, citations } of entries) {
      result += content.slice(cursor, start)
      const replacement = citations.map((citation) => (replace ? replace(citation) : '')).join('')
      result += replacement
      cursor = start + length
    }

    result += content.slice(cursor)

    return { cleaned: result, citations }
  }

  /**
   * Strips citation tags from the provided content.
   * @param content The string content containing citation tags.
   * @returns The cleaned content without citation tags.
   */
  public static stripCitationTags(content: string): string {
    // Remove all citation tags from the content
    // Removes the 【0】【0,3】【0, 5】【345】etc
    const regex = new RegExp(`${RARE_SYMBOLS.OPENING_TAG}([\\d|\\w|\\s|,]{0,})${RARE_SYMBOLS.CLOSING_TAG}?`, 'g')
    return content.replace(regex, '')
  }

  /**
   * Removes citations from a deeply nested plain object and returns a new object with citations removed.
   * @param obj The plain object to process.
   * @returns A tuple containing the new object and an array of extracted citations with paths.
   */
  public removeCitationsFromObject<T>(obj: T): [T, { path: string; citation: Citation }[]] {
    const result: { path: string; citation: Citation }[] = []

    const processObject = (current: any, path: string): any => {
      if (typeof current === 'string') {
        const extraction = this.extractCitations(current)
        if (extraction.citations.length > 0) {
          result.push(...extraction.citations.map((citation) => ({ path, citation })))
        }
        return extraction.cleaned
      } else if (typeof current === 'object' && current !== null) {
        const newObject: any = Array.isArray(current) ? [] : {}
        for (const key of Object.keys(current)) {
          newObject[key] = processObject(current[key], `${path}.${key}`)
        }
        return newObject
      }
      return current
    }

    const newObj = processObject(obj, 'root')
    return [newObj as T, result]
  }

  /**
   * Re-adds citations to the cleaned content based on their offsets.
   * @param cleaned The cleaned string without citation tags.
   * @param citations The array of citations with offsets.
   * @returns The string with citation tags re-added.
   */
  public reAddCitations(cleaned: string, citations: Citation[]): string {
    let content = cleaned
    // Sort citations by offset to ensure correct insertion order
    citations.sort((a, b) => (a.offset ?? 0) - (b.offset ?? 0))

    const adjustment = 0 // Tracks offset shifts as tags are reinserted
    for (const citation of citations) {
      if (citation.offset != null) {
        const position = citation.offset + adjustment
        content = content.slice(0, position) + citation.tag + content.slice(position)
      }
    }

    return content
  }
}
