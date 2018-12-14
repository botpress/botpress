import * as sdk from 'botpress/sdk'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

type Tag = 'o' | 'B' | 'I'

export interface Token {
  tag?: Tag
  value: string
  slot?: string
  matchedEntities: string[]
}

export interface Sequence {
  intent: string
  cannonical: string
  tokens: Token[]
}

// TODO replace this for appropriate tokenizer
const _tokenize = (input: string): string[] => {
  return input.split(' ').filter(w => w.length)
}

const _generateNonSlotTokens = (input: string): Token[] => {
  return _tokenize(input).map(
    t =>
      ({
        tag: 'o',
        value: t,
        matchedEntities: []
      } as Token)
  )
}

const _generateSlotTokens = (input: string, slot: string, slotDefinitions: sdk.NLU.IntentSlot[]): Token[] => {
  const entity = slotDefinitions.find(slotDef => slotDef.name === slot)!.entity
  return _tokenize(input).map(
    (t, i) =>
      ({
        tag: i === 0 ? 'B' : 'I',
        value: t,
        slot,
        matchedEntities: [entity]
      } as Token)
  )
}

export const generateTrainingSequence = (
  input: string,
  slotDefinitions: sdk.NLU.IntentSlot[],
  intentName: string = ''
): Sequence => {
  let m: RegExpExecArray | null
  let start = 0
  let tokens: Token[] = []

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
    intent: intentName,
    cannonical: tokens.map(t => t.value).join(' '),
    tokens
  }
}

export const generatePredictionSequence = (
  input: string,
  intentName: string,
  entitites: sdk.NLU.Entity[]
): Sequence => {
  const cannonical = input // we generate a copy here since input is going to be overriten
  let currentIdx = 0
  const tokens = _tokenize(input).map(value => {
    const inputIdx = input.indexOf(value)
    currentIdx += inputIdx // in case of tokenization uses more than one char or if words separated with multiple spaces)
    input = input.slice(inputIdx + value.length)

    const matchedEntities = entitites
      .filter(e => e.meta.start <= currentIdx && e.meta.end >= currentIdx + value.length)
      .map(e => e.name)

    currentIdx += value.length

    return {
      value,
      matchedEntities
    } as Token
  })

  return {
    intent: intentName,
    cannonical,
    tokens
  }
}
