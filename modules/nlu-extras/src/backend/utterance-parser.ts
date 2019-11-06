import _ from 'lodash'

// TODO: Refactor & use utterance-parser from NLU/Engine2

const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\. :-]+)\)/gi

export interface ParsedSlot {
  name: string
  value: string
  rawPosition: {
    start: number
    end: number
  }
  cleanPosition: {
    start: number
    end: number
  }
}

export interface UtterancePart {
  text: string
  slot?: ParsedSlot
}

export interface ParsedUtterance {
  utterance: string
  parsedSlots: ParsedSlot[]
  parts: UtterancePart[]
}

export const extractSlots = (utterance: string): RegExpExecArray[] => {
  const slotMatches: RegExpExecArray[] = []
  let matches: RegExpExecArray | null
  while ((matches = ALL_SLOTS_REGEX.exec(utterance)) !== null) {
    slotMatches.push(matches)
  }

  return slotMatches
}

export const parseUtterance = (utterance: string): ParsedUtterance => {
  let cursor = 0
  const slotMatches = extractSlots(utterance)

  const parsed = slotMatches.reduce(
    (acc, { 0: fullMatch, 1: value, 2: name, index }) => {
      const inBetweenText = utterance.slice(cursor, index)
      const clean = acc.utterance + inBetweenText + value
      cursor = index + fullMatch.length // index is stateful since its a general regex
      const parsedSlot: ParsedSlot = {
        name,
        value,
        rawPosition: {
          start: index,
          end: cursor
        },
        cleanPosition: {
          start: clean.length - value.length,
          end: clean.length
        }
      }
      return {
        utterance: clean,
        parsedSlots: [...acc.parsedSlots, parsedSlot],
        parts: [...acc.parts, { text: inBetweenText }, { text: value, slot: parsedSlot }].filter(x => x.text.length)
      }
    },
    { utterance: '', parsedSlots: [], parts: [] } as ParsedUtterance
  )

  if (cursor < utterance.length) {
    parsed.utterance += utterance.slice(cursor)
    parsed.parts = [...parsed.parts, { text: utterance.slice(cursor) }]
  }
  return parsed
}
