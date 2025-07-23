export type Range = {
  /** Inclusive */
  start: number
  /** Exclusive */
  end: number
}

export type MarkEffect = {
  type: string
  url?: string
  language?: string
}

export type MarkSegment = {
  /** Inclusive */
  start: number
  /** Exclusive */
  end: number
  effects: MarkEffect[]
  /** A set of effect(s) that are encompassed by a parent effect scope
   *
   *  @remark The nested effects' range MUST be within the parent's bounds
   *  @remark This is currently unused, but should be implemented
   *   since having the same effect ending on one character and then
   *   starting on next character tends to not parse correctly. This
   *   could lead to unforeseen interpretations by an autonomous node. */
  nestedEffects?: MarkSegment[]
}

type MarkHandler = (text: string, data: Record<string, unknown>) => string

interface TelegramMark {
  type: string
  offset: number
  length: number
  url?: string
  language?: string
}

const _handlers: Record<string, MarkHandler> = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `_${text}_`,
  strikethrough: (text: string) => `~~${text}~~`,
  code: (text: string) => `\`${text}\``,
  text_link: (text: string, data: Record<string, unknown>) => `[${text}](${data?.url || '#'})`,
  spoiler: (text: string) => `||${text}||`,
  pre: (text: string, data: Record<string, unknown>) => `\`\`\`${data?.language || ''}\n${text}\n\`\`\``,
  blockquote: (text: string) => `> ${text}`,
  phone_number: (text: string) => {
    return `[${text}](tel:${text.replace(/\D/g, '')})`
  },
  email: (text: string) => {
    return `[${text}](mailto:${text})`
  },
  // Underline does nothing because the commonmark spec doesn't support it.
  underline: (text: string, _: Record<string, unknown>) => text,
}

export function isOverlapping(a: Range, b: Range) {
  return a.start < b.end && b.start < a.end
}

export function splitIfOverlapping(rangeA: MarkSegment, rangeB: MarkSegment): MarkSegment[] {
  if (!isOverlapping(rangeA, rangeB)) {
    return [rangeA]
  }

  const result: MarkSegment[] = []
  const startOverlap = Math.max(rangeA.start, rangeB.start)
  const endOverlap = Math.min(rangeA.end, rangeB.end)

  const startMin = Math.min(rangeA.start, rangeB.start)
  if (startMin < startOverlap) {
    const startType = rangeA.start < startOverlap ? rangeA.effects : rangeB.effects
    result.push({ start: startMin, end: startOverlap, effects: startType })
  }

  result.push({ start: startOverlap, end: endOverlap, effects: rangeA.effects.concat(rangeB.effects) })

  const endMax = Math.max(rangeA.end, rangeB.end)
  if (endOverlap < endMax) {
    const endType = endOverlap < rangeB.end ? rangeB.effects : rangeA.effects
    result.push({ start: endOverlap, end: endMax, effects: endType })
  }

  return result
}

function _combineEffects(range: MarkSegment, otherIndex: number, arr: MarkSegment[]) {
  if (otherIndex !== -1) {
    const otherEffects = arr[otherIndex]?.effects ?? []
    const uniqueEffects = range.effects.filter(
      ({ type }: MarkEffect) => !otherEffects.some(({ type: otherType }: MarkEffect) => type === otherType)
    )
    arr[otherIndex]?.effects.push(...uniqueEffects)
  }
}

const _byAscendingStartIndex = (a: MarkSegment, b: MarkSegment) => a.start - b.start
export function splitAnyOverlaps(ranges: MarkSegment[]): MarkSegment[] {
  const rangesToSplit = [...ranges]
  rangesToSplit.sort(_byAscendingStartIndex)

  if (rangesToSplit.length < 2) {
    return rangesToSplit
  }

  // TODO: Optimize if possible
  return rangesToSplit.reduce(
    (splitRanges: MarkSegment[], range: MarkSegment) => {
      let newSplitRanges = splitRanges
        .reduce((arr: MarkSegment[], otherRange: MarkSegment) => {
          const newRanges = splitIfOverlapping(otherRange, range)
          return arr.concat(newRanges)
        }, [])
        // TODO: Check performance trade-off of moving filter outside the outer "reduce" scope
        .filter((range: MarkSegment, index: number, arr: MarkSegment[]) => {
          if (range.start === range.end) return false
          const otherIndex = arr.findIndex(({ start, end }) => range.start === start && range.end === end)
          _combineEffects(range, otherIndex, arr)
          return index === otherIndex
        })

      if (newSplitRanges.every((otherRange) => !isOverlapping(range, otherRange))) {
        newSplitRanges = newSplitRanges.concat(range).sort(_byAscendingStartIndex)
      }

      return newSplitRanges
    },
    [rangesToSplit.shift()!]
  )
}

export function applyMarksToText(text: string, marks: TelegramMark[]) {
  const segments = marks.map(
    (mark: TelegramMark): MarkSegment => ({
      start: mark.offset,
      // Blockquote can only affect the whole line
      end: mark.type !== 'blockquote' ? mark.offset + mark.length : mark.offset + 1,
      effects: [
        {
          type: mark.type,
          url: mark.url,
          language: mark.language,
        },
      ],
    })
  )

  const plainTextSegment = { start: 0, end: text.length, effects: [] }
  return (
    splitAnyOverlaps(segments.concat(plainTextSegment))
      .sort(_byAscendingStartIndex)
      /** TODO: Implement post-process optimization step to join contiguous
       *   ranges if at least one effect is identical. This will then nest the
       *   partial range effect within.
       *
       *   @remark "Hello World" where whole string is bold, but only "World"
       *    is strikethrough currently yields "**Hello ****~~World~~**". The proposed
       *    TODO above would change that to "**Hello ~~World~~**". */
      .map((markSegment) => {
        const { start, end, effects } = markSegment
        let transformedText = text.substring(start, end)

        for (const effect of effects) {
          const { type, url, language } = effect

          // @ts-ignore
          const handler = _handlers[type] as Function | undefined
          if (!handler) {
            console.warn(`Unknown mark type: ${type}`)
            continue
          }

          transformedText = handler(transformedText, {
            url,
            language,
          })
        }

        return transformedText
      })
      .join('')
  )
}
