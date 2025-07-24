import { spliceText } from './string-utils'

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

export type MarkSegment = Range & {
  effects: MarkEffect[]
  /** A set of effect(s) that are encompassed by a parent effect scope
   *
   *  @remark The nested segments' range MUST be within the parent's bounds */
  children?: MarkSegment[]
}

export type TelegramMark = {
  type: string
  offset: number
  length: number
  url?: string
  language?: string
}

type MarkHandler = (text: string, data: Record<string, unknown>) => string
const _handlers: Record<string, MarkHandler> = {
  bold: (text: string) => `**${text}**`,
  italic: (text: string) => `*${text}*`,
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
  underline: (text: string) => text,
}

export const isOverlapping = (a: Range, b: Range) => {
  return a.start < b.end && b.start < a.end
}

export const splitIfOverlapping = (rangeA: MarkSegment, rangeB: MarkSegment): MarkSegment[] => {
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

const _combineEffects = (range: MarkSegment, otherIndex: number, arr: MarkSegment[]) => {
  if (otherIndex !== -1) {
    const otherEffects = arr[otherIndex]?.effects ?? []
    const uniqueEffects = range.effects.filter(
      ({ type }: MarkEffect) => !otherEffects.some(({ type: otherType }: MarkEffect) => type === otherType)
    )
    arr[otherIndex]?.effects.push(...uniqueEffects)
  }
}

const _byAscendingStartIndex = (a: MarkSegment, b: MarkSegment) => a.start - b.start
const _byDescendingStartIndex = (a: MarkSegment, b: MarkSegment) => b.start - a.start
export const splitAnyOverlaps = (ranges: MarkSegment[]): MarkSegment[] => {
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

const _areSegmentsNonOverlappingContiguous = (text: string, sortedRanges: MarkSegment[]) => {
  if (sortedRanges.length === 0) return true

  // Not sure if this check should be done at runtime or if we should just trust the unit tests here
  if (sortedRanges[0]!.start !== 0 || sortedRanges[sortedRanges.length - 1]!.end !== text.length) {
    return false
  }

  return sortedRanges.every((range, index, arr) => {
    const nextRange = arr[index + 1]
    if (!nextRange) return true

    return range.end === nextRange.start
  })
}

const _hasMarkType = (marks: MarkEffect[], markType: string) => {
  return marks.some((otherMark) => otherMark.type === markType)
}

export const postProcessNestedEffects = (
  unprocessedSegments: MarkSegment[],
  precheck?: (sortedSegments: MarkSegment[]) => void
) => {
  const reversedSegments: MarkSegment[] = [...unprocessedSegments].sort(_byDescendingStartIndex)
  precheck?.(unprocessedSegments)

  for (let index = reversedSegments.length - 1; index > 0; index--) {
    const segment: MarkSegment = reversedSegments[index]!
    if (segment.effects.length === 0) continue

    const otherIndex = index - 1
    const otherSegment: MarkSegment = reversedSegments[otherIndex]!

    const sharedMarks: MarkEffect[] = []
    const segmentNonSharedMarks: MarkEffect[] = []
    segment.effects.forEach((mark: MarkEffect) => {
      if (_hasMarkType(otherSegment.effects, mark.type)) {
        sharedMarks.push(mark)
      } else {
        segmentNonSharedMarks.push(mark)
      }
    })

    if (sharedMarks.length === 0) {
      continue
    }

    const mergedSegment: MarkSegment = {
      start: segment.start,
      end: otherSegment.end,
      effects: sharedMarks,
    }

    const otherSegmentNonSharedMarks: MarkEffect[] = otherSegment.effects.filter(
      (mark: MarkEffect) => !_hasMarkType(sharedMarks, mark.type)
    )

    let childSegments: MarkSegment[] = [...(segment.children ?? [])]
    if (segmentNonSharedMarks.length > 0) {
      childSegments = childSegments.concat({
        start: segment.start,
        end: segment.end,
        effects: segmentNonSharedMarks,
      })
    }
    if (otherSegmentNonSharedMarks.length > 0) {
      childSegments = childSegments.concat({
        start: otherSegment.start,
        end: otherSegment.end,
        effects: otherSegmentNonSharedMarks,
      })
    }
    if (childSegments.length > 0) {
      mergedSegment.children = childSegments
    }

    reversedSegments[otherIndex] = mergedSegment
    reversedSegments.splice(index, 1)
  }

  // This is done after the above loop to not post-process
  // the children before all the potential children are added
  const processedSegments = reversedSegments.reverse()
  processedSegments.forEach((segment) => {
    if (segment.children) {
      segment.children = postProcessNestedEffects(segment.children)
    }
  })

  return processedSegments
}

export const applyMarkToTextSegment = (text: string, segment: MarkSegment, offset: number = 0) => {
  const { start, end, effects, children } = segment
  const startIndex = start - offset
  let transformedText = text.substring(startIndex, end - offset)

  if (children) {
    // Each child segment **should** be non-overlapping
    children.sort(_byDescendingStartIndex).forEach((child) => {
      const transformedSegment = applyMarkToTextSegment(transformedText, child, start)
      transformedText = spliceText(transformedText, child.start - start, child.end - start, transformedSegment)
    })
  }

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
}

export const applyMarksToText = (text: string, marks: TelegramMark[]) => {
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
  const nonOverlappingSegments = splitAnyOverlaps(segments.concat(plainTextSegment))
  const processedSegments = postProcessNestedEffects(nonOverlappingSegments, (sortedSegments) => {
    if (!_areSegmentsNonOverlappingContiguous(text, sortedSegments)) {
      throw new Error('Nested effects are not contiguous')
    }
  })

  return processedSegments.map((markSegment) => applyMarkToTextSegment(text, markSegment)).join('')
}
