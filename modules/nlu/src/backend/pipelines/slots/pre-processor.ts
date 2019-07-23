import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { makeTokens, mergeSpecialCharactersTokens } from '../../tools/token-utils'
import { allInRange } from '../../tools/math'
import { LanguageProvider, KnownSlot, TrainingSequence } from '../../typings'
import { BIO, Sequence, Token } from '../../typings'

const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi
const ITTERATIVE_SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/i

export function keepEntityTypes(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$2')
}

export function keepEntityValues(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$1')
}

export function getKnownSlots(text: string, slotDefinitions: sdk.NLU.SlotDefinition[]): KnownSlot[] {
  const slots = [] as KnownSlot[]

  let regResult: RegExpExecArray | null
  let cursor = 0
  do {
    const textCpy = text.substring(cursor)
    regResult = ITTERATIVE_SLOTS_REGEX.exec(textCpy)
    if (regResult) {
      const rawMatch = regResult[0]
      const source = regResult[1] as string
      const slotName = regResult[2] as string

      const previousSlot = _.last(slots)
      const start = (previousSlot ? previousSlot.end : 0) + regResult.index
      const end = start + source.length

      cursor = start + rawMatch.length

      const slotDef = slotDefinitions.find(sd => sd.name === slotName)

      if (slotDef) {
        slots.push({ ...slotDef, start, end, source })
      }
    }
  } while (regResult)

  return slots
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

  const [rawToks] = await languageProvider.tokenize([input.toLowerCase()], lang)
  return makeTokens(rawToks, input).map((t, idx) => {
    const tok = {
      ...t,
      start: start + t.start,
      end: start + t.end,
      matchedEntities,
      tag: tagToken(idx),
      slot
    } as Token

    return tok
  })
}

const charactersToMerge: string[] = '"+è-_!@#$%?&*()1234567890~`/\\[]{}:;<>='.split('')

export const generatePredictionSequence = async (
  input: string,
  intentName: string,
  entities: sdk.NLU.Entity[],
  toks: Token[]
): Promise<Sequence> => {
  const tokens = mergeSpecialCharactersTokens(toks, charactersToMerge).map(tok => {
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
): Promise<TrainingSequence> => {
  let tokens: Token[] = []
  const genToken = _generateTrainingTokens(langProvider)
  const cannonical = keepEntityValues(input)
  const knownSlots = getKnownSlots(input, slotDefinitions)

  // TODO: this logic belongs near makeTokens and we should let makeTokens fill the matched entities
  for (const slot of knownSlots) {
    const start = _.isEmpty(tokens) ? 0 : _.last(tokens)!.end
    const sub = cannonical.substring(start, slot.start - 1)
    const tokensBeforeSlot = await genToken(sub, lang, start)

    const slotTokens = await genToken(slot.source, lang, slot.start, slot.name, slotDefinitions)

    tokens = [...tokens, ...tokensBeforeSlot, ...slotTokens]
  }

  const lastSlot = _.maxBy(knownSlots, ks => ks.end)
  if (lastSlot && lastSlot!.end < cannonical.length) {
    const textLeftAfterLastSlot: string = cannonical.substring(lastSlot!.end)
    const start = _.isEmpty(tokens) ? 0 : _.last(tokens)!.end
    const tokensLeft = await genToken(textLeftAfterLastSlot, lang, start)
    tokens = [...tokens, ...tokensLeft]
  }

  return {
    intent: intentName,
    cannonical,
    tokens,
    contexts,
    knownSlots
  }
}
