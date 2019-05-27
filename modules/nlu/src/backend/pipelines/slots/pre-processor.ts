import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { getAllMatchingForRegex } from '../../../util'
import { BIO, Sequence, Tag, Token } from '../../typings'
import { tokenize } from '../language/tokenizers'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

const getAllMatchingSlots = getAllMatchingForRegex(SLOTS_REGEX)

export function keepEntityTypes(text: string): string {
  return text.replace(SLOTS_REGEX, '$2')
}

export function keepEntityValues(text: string): string {
  return text.replace(SLOTS_REGEX, '$1')
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
  lang: string,
  start: number,
  slot: string = '',
  slotDefinitions: sdk.NLU.SlotDefinition[] = []
): Token[] => {
  const matchedEntities = _.flatten(
    slotDefinitions.filter(slotDef => slot && slotDef.name === slot).map(slotDef => slotDef.entities)
  )

  const tagToken = index => (!slot ? BIO.OUT : index === 0 ? BIO.BEGINNING : BIO.INSIDE)

  return tokenize(input, lang).map((t, idx) => {
    const token = _makeToken(t, matchedEntities, start, tagToken(idx), slot)
    start += t.length + 1 // 1 is the space char, replace this by what was done in the prediction sequence

    return token
  })
}

export const generatePredictionSequence = (
  input: string,
  lang: string,
  intentName: string,
  entities: sdk.NLU.Entity[]
): Sequence => {
  const cannonical = input // we generate a copy here since input is mutating
  let currentIdx = 0

  const tokens = tokenize(input, lang).map(value => {
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

export const generateTrainingSequence = (
  input: string,
  lang: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  intentName: string = '',
  contexts: string[] = []
): Sequence => {
  let start = 0
  let tokens: Token[] = []

  tokens = getAllMatchingSlots(input).reduce((tokens, slot) => {
    const sub = input.substr(start, slot.index - start - 1)

    start = slot.index + slot[0].length

    return tokens.concat([
      ..._generateTrainingTokens(sub, lang, start),
      ..._generateTrainingTokens(slot[1], lang, start + slot.index, slot[2], slotDefinitions)
    ])
  }, [])

  if (start !== input.length) {
    const lastingPart = input.substr(start, input.length - start)
    tokens = [...tokens, ..._generateTrainingTokens(lastingPart, lang, start)]
  }

  return {
    intent: intentName,
    cannonical: input,
    tokens,
    contexts
  }
}
