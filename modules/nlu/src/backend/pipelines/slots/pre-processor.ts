import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { makeTokens } from '../../tools/make-tokens'
import { allInRange } from '../../tools/math'
import { LanguageProvider } from '../../typings'
import { BIO, Sequence, Token } from '../../typings'
import { sanitize } from '../language/sanitizer'

const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi
const ITTERATIVE_SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/i

export function keepEntityTypes(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$2')
}

export function keepEntityValues(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$1')
}

// TODO use the same algorithm as in the prediction sequence
const _generateTrainingTokens = languageProvider => async (
  input: string,
  lang: string,
  start: number = 0,
  slot: string = '',
  slotDefinitions: sdk.NLU.SlotDefinition[] = []
): Promise<Token[]> => {
  const matchedEntities = _.flatten(
    slotDefinitions.filter(slotDef => slot && slotDef.name === slot).map(slotDef => slotDef.entities)
  )

  const tagToken = index => (!slot ? BIO.OUT : index === 0 ? BIO.BEGINNING : BIO.INSIDE)

  const rawToks = await languageProvider.tokenize(input.toLowerCase(), lang)
  return makeTokens(rawToks, input).map((t, idx) => {
    const tok = {
      ...t,
      matchedEntities,
      tag: tagToken(idx),
      start,
      end: start + t.value.length,
      slot
    } as Token

    start += t.value.length
    return tok
  })
}

export const generatePredictionSequence = async (
  input: string,
  intentName: string,
  entities: sdk.NLU.Entity[],
  toks: Token[]
): Promise<Sequence> => {
  const tokens = toks.map(tok => {
    const matchedEntities = entities
      .filter(e => allInRange([tok.start, tok.end], e.meta.start, e.meta.end + 1))
      .map(e => e.name)

    return {
      ...tok,
      matchedEntities
    }
  })

  return {
    intent: intentName,
    cannonical: input,
    tokens
  }
}

export const generateTrainingSequence = (langProvider: LanguageProvider) => async (
  input: string,
  lang: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  intentName: string = '',
  contexts: string[] = []
): Promise<Sequence> => {
  let tokens: Token[] = []
  let matches: RegExpExecArray | null
  const genToken = _generateTrainingTokens(langProvider)
  const cannonical = keepEntityValues(input)
  let inputCopy = input

  do {
    matches = ITTERATIVE_SLOTS_REGEX.exec(inputCopy)

    if (matches) {
      const sub = inputCopy.substr(0, matches.index - 1)
      const start = _.isEmpty(tokens) ? 0 : _.last(tokens)!.end
      const tokensBeforeSlot = await genToken(sub, lang, start)

      const slotTokens = await genToken(matches[1], lang, start + matches.index, matches[2], slotDefinitions)

      tokens = [...tokens, ...tokensBeforeSlot, ...slotTokens]
      inputCopy = inputCopy.substr(matches.index + matches[0].length).trim()
    }
  } while (matches)

  if (inputCopy.length) {
    tokens = [...tokens, ...(await genToken(inputCopy, lang, _.isEmpty(tokens) ? 0 : _.last(tokens)!.end))]
  }

  return {
    intent: intentName,
    cannonical,
    tokens,
    contexts
  }
}
