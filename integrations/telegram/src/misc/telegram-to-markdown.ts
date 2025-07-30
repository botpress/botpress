import { spliceText } from './string-utils'

type Range = {
  /** Inclusive */
  start: number
  /** Exclusive */
  end: number
}

type MarkEffect = {
  type: string
  url?: string
  language?: string
}

type MarkSegment = Range & {
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

// Higher === Applied after other effects
const markSortOffsets: Record<string, number> = {
  bold: 0,
  italic: 0,
  strikethrough: 0,
  spoiler: 0,
  code: 1,
  pre: 1,
  blockquote: 2,
  text_link: 0,
  phone_number: 0,
  email: 0,
  underline: 0,
}

const _applyWhitespaceSensitiveMark = (markHandler: MarkHandler) => {
  return (text: string, data: Record<string, unknown>): string => {
    let startWhitespace: string | undefined = undefined
    let endWhitespace: string | undefined = undefined
    const matchAllResult = text.matchAll(/(?<start>^\s+)|(?<end>\s+$)/g)
    Array.from(matchAllResult).forEach((match) => {
      startWhitespace ??= match.groups?.start
      endWhitespace ??= match.groups?.end
    })

    return `${startWhitespace ?? ''}${markHandler(text.trim(), data)}${endWhitespace ?? ''}`
  }
}

type MarkHandler = (text: string, data: Record<string, unknown>) => string
const _handlers: Record<string, MarkHandler> = {
  bold: _applyWhitespaceSensitiveMark((text: string) => `**${text}**`),
  italic: _applyWhitespaceSensitiveMark((text: string) => `*${text}*`),
  strikethrough: _applyWhitespaceSensitiveMark((text: string) => `~~${text}~~`),
  spoiler: _applyWhitespaceSensitiveMark((text: string) => `||${text}||`),
  code: _applyWhitespaceSensitiveMark((text: string) => `\`${text}\``),
  pre: (text: string, data: Record<string, unknown>) => `\`\`\`${data?.language || ''}\n${text}\n\`\`\``,
  blockquote: (text: string) => `> ${text.replace(/\n/g, '\n> ')}`,
  text_link: _applyWhitespaceSensitiveMark(
    (text: string, data: Record<string, unknown>) => `[${text}](${data?.url || '#'})`
  ),
  phone_number: _applyWhitespaceSensitiveMark((text: string) => {
    return `[${text}](tel:${text.replace(/\D/g, '')})`
  }),
  email: _applyWhitespaceSensitiveMark((text: string) => {
    return `[${text}](mailto:${text})`
  }),
  // Underline does nothing because the commonmark spec doesn't support it.
  underline: (text: string) => text,
}

const _isOverlapping = (a: Range, b: Range) => {
  return a.start < b.end && b.start < a.end
}

const _splitIfOverlapping = (rangeA: MarkSegment, rangeB: MarkSegment): MarkSegment[] => {
  if (!_isOverlapping(rangeA, rangeB)) {
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

const _byAscendingStartThenByDescendingLength = (a: MarkSegment, b: MarkSegment) => {
  return a.start !== b.start ? a.start - b.start : b.end - a.end
}
const _byDescendingStartIndex = (a: MarkSegment, b: MarkSegment) => b.start - a.start
const _splitAnyOverlaps = (ranges: MarkSegment[]): MarkSegment[] => {
  if (ranges.length < 2) {
    return ranges
  }

  // TODO: Optimize if possible
  const rangesToSplit = [...ranges].sort(_byAscendingStartThenByDescendingLength)
  return rangesToSplit.reduce(
    (splitRanges: MarkSegment[], range: MarkSegment) => {
      let newSplitRanges = splitRanges
        .reduce((arr: MarkSegment[], otherRange: MarkSegment) => {
          const newRanges = _splitIfOverlapping(otherRange, range)
          return arr.concat(newRanges)
        }, [])
        .filter((range: MarkSegment, index: number, arr: MarkSegment[]) => {
          if (range.start === range.end) return false
          const otherIndex = arr.findIndex(({ start, end }) => range.start === start && range.end === end)
          _combineEffects(range, otherIndex, arr)
          return index === otherIndex
        })

      if (newSplitRanges.every((otherRange) => !_isOverlapping(range, otherRange))) {
        newSplitRanges = newSplitRanges.concat(range).sort(_byAscendingStartThenByDescendingLength)
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

const _postProcessNestedEffects = (
  unprocessedSegments: MarkSegment[],
  precheck?: (sortedSegments: MarkSegment[]) => void
) => {
  const reversedSegments: MarkSegment[] = [...unprocessedSegments].sort(_byDescendingStartIndex)
  precheck?.([...reversedSegments].reverse())

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

    const otherSegmentNonSharedMarks: MarkEffect[] = otherSegment.effects.filter(
      (mark: MarkEffect) => !_hasMarkType(sharedMarks, mark.type)
    )

    let childSegments: MarkSegment[] = [...(segment.children ?? [])].concat(otherSegment.children ?? [])
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

    const mergedSegment: MarkSegment = {
      start: segment.start,
      end: otherSegment.end,
      effects: sharedMarks,
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
      segment.children = _postProcessNestedEffects(segment.children)
    }
  })

  return processedSegments
}

const _applyMarkToTextSegment = (text: string, segment: MarkSegment, offset: number = 0) => {
  const unknownMarkWarnings: string[] = []
  const { start, end, effects, children } = segment
  const startIndex = start - offset
  let transformedText = text.substring(startIndex, end - offset)

  if (children) {
    // Each child segment **should** be non-overlapping
    children.sort(_byDescendingStartIndex).forEach((child) => {
      const { text: transformedSegment, warnings } = _applyMarkToTextSegment(transformedText, child, start)
      transformedText = spliceText(transformedText, child.start - start, child.end - start, transformedSegment)
      unknownMarkWarnings.push(...warnings)
    })
  }

  effects
    .sort((a, b) => {
      return (markSortOffsets[a.type] ?? 0) - (markSortOffsets[b.type] ?? 0)
    })
    .forEach((effect) => {
      const { type, url, language } = effect

      // @ts-ignore
      const handler = _handlers[type] as Function | undefined
      if (!handler) {
        unknownMarkWarnings.push(`Unknown mark type: ${type}`)
        return
      }

      transformedText = handler(transformedText, {
        url,
        language,
      })
    })

  return { text: transformedText, warnings: unknownMarkWarnings }
}

export const telegramTextMsgToStdMarkdown = (text: string, marks: TelegramMark[] = []) => {
  if (marks.length === 0) return { text }

  const segments = marks.map((mark: TelegramMark): MarkSegment => {
    const start = mark.offset
    const end = mark.offset + mark.length
    return {
      start,
      end,
      effects: [
        {
          type: mark.type,
          url: mark.url,
          language: mark.language,
        },
      ],
    }
  })

  const plainTextSegment = { start: 0, end: text.length, effects: [] }
  const nonOverlappingSegments = _splitAnyOverlaps(segments.concat(plainTextSegment))
  const processedSegments = _postProcessNestedEffects(nonOverlappingSegments, (sortedSegments) => {
    if (!_areSegmentsNonOverlappingContiguous(text, sortedSegments)) {
      throw new Error('Nested effects are not contiguous')
    }
  })

  let transformedText = ''
  const transformWarnings: string[] = []
  for (const markSegment of processedSegments) {
    const { text: textSegment, warnings } = _applyMarkToTextSegment(text, markSegment)
    transformWarnings.push(...warnings)
    transformedText += textSegment
  }

  return { text: transformedText, warnings: transformWarnings }
}
