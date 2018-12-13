import * as sdk from 'botpress/sdk'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

export type Token = { type: string; value: string }

type Tag = 'o' | 'B' | 'I'

// this will replace the current Token type
export interface Tok {
  tag?: Tag
  value: string
  slot?: string
  matchedEntities: string[]
}

export interface Sequence {
  cannonical: string
  tokens: Tok[]
}

// TODO replace this for appropriate tokenizer
const _tokenize = (input: string): string[] => {
  return input.split(' ').filter(w => w.length)
}

const _generateNonSlotTokens = (input: string): Tok[] => {
  return _tokenize(input)
    .map(t => ({
      tag: 'o',
      value: t.toLowerCase(),
      matchedEntities: []
    } as Tok))
}

const _generateSlotTokens = (input: string, slot: string, slotDefinitions: sdk.NLU.IntentSlot[]): Tok[] => {
  const entity = slotDefinitions.find(slotDef => slotDef.name === slot)!.entity
  return _tokenize(input)
    .map((t, i) => ({
      tag: i === 0 ? 'B' : 'I',
      value: t,
      slot,
      matchedEntities: [entity],
    } as Tok))
}

export const generateTrainingSequence = (input: string, slotDefinitions: sdk.NLU.IntentSlot[]): Sequence => {
  let m: RegExpExecArray | null
  let start = 0
  let tokens: Tok[] = []

  do {
    m = SLOTS_REGEX.exec(input)
    if (m) {
      const sub = input.substr(start, m.index - start - 1)
      tokens = [...tokens, ..._generateNonSlotTokens(sub), ..._generateSlotTokens(m[1], m[2], slotDefinitions)]
      start = m.index + m[0].length
    }
  } while (m)

  if (start !== input.length) {
    const lastingPart = input.substr(start, input.length - start)
    tokens = [...tokens, ..._generateNonSlotTokens(lastingPart)]
  }

  return {
    cannonical: tokens.map(t => t.value).join(' '),
    tokens
  }
}

export const generatePredictionSequence = (input: string, entitites: sdk.NLU.Entity[]): Sequence => {
  const cannonical = input // we generate a copy here since input is going to be overriten
  let currentIdx = 0
  const tokens = _tokenize(input).map(value => {
    const inputIdx = input.indexOf(value)
    currentIdx += inputIdx // in case of tokenization uses more than one char or if words separated with multiple spaces

    const matchedEntities = entitites
      .filter(e => e.meta.start <= currentIdx && e.meta.end >= (currentIdx + value.length))
      .map(e => e.name)

    currentIdx += value.length
    input = input.slice(inputIdx + value.length)

    return {
      value,
      matchedEntities
    } as Tok
  })

  return {
    cannonical,
    tokens
  }
}

// TODO remove this
export const tokenize = (input: string, lowercase: boolean = true): Token[] => {
  let m: RegExpExecArray | null
  let start = 0
  const tokens: Token[] = []


  do {
    m = SLOTS_REGEX.exec(input)
    if (m) {
      const sub = input.substr(start, m.index - start - 1)
      sub
        .split(' ')
        .filter(x => x.length)
        .forEach(t => {
          tokens.push({ type: 'o', value: t.toLowerCase() })
        })

      m[1]
        .split(' ')
        .filter(x => x.length)
        .forEach((t, i) => {
          tokens.push({ type: (i === 0 ? 'B-' : 'I-') + m![2]!, value: t })
        })

      start = m.index + m[0].length
    }
  } while (m)

  if (start !== input.length) {
    input
      .substr(start, input.length - start)
      .split(' ')
      .filter(x => x.length)
      .forEach(t => {
        tokens.push({ type: 'o', value: lowercase ? t.toLowerCase() : t })
      })
  }

  return tokens
}
