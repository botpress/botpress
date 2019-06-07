import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { LanguageProvider } from '../../language-provider'
import { BIO, Sequence, Token } from '../../typings'
import { sanitize } from '../language/sanitizer'

const SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

export function keepEntityTypes(text: string): string {
  return text.replace(SLOTS_REGEX, '$2')
}

export function keepEntityValues(text: string): string {
  return text.replace(SLOTS_REGEX, '$1')
}

const _makeToken = (value: string, matchedEntities: string[], start: number, tag = '', slot = ''): Token =>
  ({
    value,
    matchedEntities,
    start,
    end: start + value.length,
    tag,
    slot
  } as Token)

// TODO use the same algorithm as in the prediction sequence
const _generateTrainingTokens = languageProvider => async (
  input: string,
  lang: string,
  start: number,
  slot: string = '',
  slotDefinitions: sdk.NLU.SlotDefinition[] = []
): Promise<Token[]> => {
  const matchedEntities = _.flatten(
    slotDefinitions.filter(slotDef => slot && slotDef.name === slot).map(slotDef => slotDef.entities)
  )

  const tagToken = index => (!slot ? BIO.OUT : index === 0 ? BIO.BEGINNING : BIO.INSIDE)

  return (await languageProvider.tokenize(input, lang))
    .map(sanitize)
    .filter(x => !!x)
    .map((t, idx) => {
      const token = _makeToken(t, matchedEntities, start, tagToken(idx), slot)
      start += t.length
      return token
    })
}

export const generatePredictionSequence = async (
  input: string,
  intentName: string,
  entities: sdk.NLU.Entity[],
  tokens: string[]
): Promise<Sequence> => {
  const cannonical = input // we generate a copy here since input is mutating
  let currentIdx = 0

  const taggedTokens = tokens.map(value => {
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
    tokens: taggedTokens
  }
}

//I don't like the async reduce, we might want to refactor this when merging logic
//I also don't like that the lang provider is passed a parametter, we chould make as a class
export const generateTrainingSequence = (langProvider: LanguageProvider) => async (
  input: string,
  lang: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  intentName: string = '',
  contexts: string[] = []
): Promise<Sequence> => {
  let start = 0
  let tokens: Token[] = []
  let matches: RegExpExecArray | null
  const genToken = _generateTrainingTokens(langProvider)

  do {
    matches = SLOTS_REGEX.exec(input)

    if (matches) {
      const sub = input.substr(start, matches.index - start - 1)
      tokens = [
        ...tokens,
        ...(await genToken(sub, lang, start)),
        ...(await genToken(matches[1], lang, start + matches.index, matches[2], slotDefinitions))
      ]
      start = matches.index + matches[0].length
    }
  } while (matches)

  if (start !== input.length) {
    const lastingPart = input.substr(start, input.length - start)
    tokens = [...tokens, ...(await genToken(lastingPart, lang, start))]
  }

  return {
    intent: intentName,
    cannonical: input,
    tokens,
    contexts
  }
}
