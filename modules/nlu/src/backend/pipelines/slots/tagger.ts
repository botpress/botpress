import * as sdk from 'botpress/sdk'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

export type Token = { type: string; value: string }

type Tag = 'o' | 'B' | 'I'

// this will replace the current Token type
export interface Tok {
  tag: Tag
  value: string
  slot?: string
  matchedEntity?: string
}

export interface Sequence {
  cannonical: string
  tokens: Tok[]
}

const _generateNonSlotTokens = (input: string): Tok[] => {
  return input
    .split(' ') // use appropriate tokenizer
    .filter(x => x.length)
    .map(t => ({
      tag: 'o',
      value: t.toLowerCase()
    } as Tok))
}

const _generateSlotTokens = (input: string, slot: string, slotDefinitions: sdk.NLU.IntentSlot[]): Tok[] => {
  const matchedEntity = slotDefinitions.find(slotDef => slotDef.name === slot)!.entity
  return input
    .split(' ') // use appropriate tokenizer here
    .filter(x => x.length)
    .map((t, i) => ({
      tag: i === 0 ? 'B' : 'I',
      value: t,
      slot,
      matchedEntity,
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
// TODO use pattern-utils extract patterns
// TODO add entity matching
export const tokenize = (phrase: string, lowercase: boolean = true): Token[] => {
  let m: RegExpExecArray | null
  let start = 0
  const tokens: Token[] = []

  do {
    m = SLOTS_REGEX.exec(phrase)
    if (m) {
      const sub = phrase.substr(start, m.index - start - 1)
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

  if (start !== phrase.length) {
    phrase
      .substr(start, phrase.length - start)
      .split(' ')
      .filter(x => x.length)
      .forEach(t => {
        tokens.push({ type: 'o', value: lowercase ? t.toLowerCase() : t })
      })
  }

  return tokens
}
