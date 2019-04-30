import * as sdk from 'botpress/sdk'

import { BIO, Sequence, Tag, Token } from '../../typings'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

// TODO replace this for appropriate tokenizer
const _tokenize = (input: string): string[] => {
  return input.split(' ').filter(w => w.length)
}

const _makeToken = (value: string, matchedEntities: string[], start: number, tag = '', slot = ''): Token => {
  const token = {
    value,
    matchedEntities,
    start,
    end: start + value.length
  } as Token

  if (tag) {
    token.tag = <Tag>tag
  }
  if (slot) {
    token.slot = slot
  }
  return token
}

// TODO use the same algorithm as in the prediction sequence
const _generateTrainingTokens = (
  input: string,
  start: number,
  slot: string = '',
  slotDefinitions: sdk.NLU.SlotDefinition[] = []
): Token[] => {
  const slotDef = slotDefinitions.find(slotDef => !!slot && slotDef.name === slot)
  const matchedEntities = slotDef ? slotDef.entities : []

  return _tokenize(input).map((t, idx) => {
    let tag = BIO.OUT
    if (slot) {
      tag = idx === 0 ? BIO.BEGINNING : BIO.INSIDE
    }

    const token = _makeToken(t, matchedEntities, start, tag, slot)
    start += t.length + 1 // 1 is the space char, replace this by what was done in the prediction sequence

    return token
  })
}

export const generateTrainingSequence = (
  input: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  intentName: string = '',
  contexts: string[] = []
): Sequence => {
  let matches: RegExpExecArray | null
  let start = 0
  let tokens: Token[] = []

  do {
    matches = SLOTS_REGEX.exec(input)
    if (matches) {
      const sub = input.substr(start, matches.index - start - 1)
      tokens = [
        ...tokens,
        ..._generateTrainingTokens(sub, start),
        ..._generateTrainingTokens(matches[1], start + matches.index, matches[2], slotDefinitions)
      ]
      start = matches.index + matches[0].length
    }
  } while (matches)

  if (start !== input.length) {
    const lastingPart = input.substr(start, input.length - start)
    tokens = [...tokens, ..._generateTrainingTokens(lastingPart, start)]
  }

  return {
    intent: intentName,
    cannonical: tokens.map(t => t.value).join(' '),
    tokens,
    contexts
  }
}

export const generatePredictionSequence = (input: string, intentName: string, entities: sdk.NLU.Entity[]): Sequence => {
  const cannonical = input // we generate a copy here since input is mutating
  let currentIdx = 0
  const tokens = _tokenize(input).map(value => {
    const inputIdx = input.indexOf(value)
    currentIdx += inputIdx // in case of tokenization uses more than one char i.e words separated with multiple spaces
    input = input.slice(inputIdx + value.length)

    const matchedEntities = entities
      .filter(e => e.meta.start <= currentIdx && e.meta.end >= currentIdx + value.length)
      .map(e => e.name)

    const token = _makeToken(value, matchedEntities, currentIdx)
    currentIdx = token.end // move cursor to end of token in original input
    return token
  })

  return {
    intent: intentName,
    cannonical,
    tokens
  }
}
