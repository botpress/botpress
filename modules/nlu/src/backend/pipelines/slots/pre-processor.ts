import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { allInRange } from '../../tools/math'
import { makeTokens, mergeSpecialCharactersTokens } from '../../tools/token-utils'
import { KnownSlot, LanguageProvider, TrainingSequence } from '../../typings'
import { BIO, Sequence, Token } from '../../typings'

const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\.-]+)\)/gi

export function keepEntityTypes(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$2')
}

export function keepEntityValues(text: string): string {
  return text.replace(ALL_SLOTS_REGEX, '$1')
}

export function getKnownSlots(
  text: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  logger: sdk.Logger
): KnownSlot[] {
  const slots = [] as KnownSlot[]
  const localSlotsRegex = /\[(.+?)\]\(([\w_\.-]+)\)/gi // local because it is stateful

  let removedChars = 0
  let regResult: RegExpExecArray | null
  while ((regResult = localSlotsRegex.exec(text))) {
    const rawMatch = regResult[0]
    const source = regResult[1] as string
    const slotName = regResult[2] as string

    const slotDef = slotDefinitions.find(sd => sd.name === slotName)

    if (slotDef) {
      const start = regResult.index - removedChars
      removedChars += rawMatch.length - source.length
      slots.push({ ...slotDef, start, end: start + source.length, source })
    } else {
      logger.warn(`A slot was found for utterance: ${text} but was not found in slot definitions.`)
    }
  }

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

export const generateTrainingSequence = (langProvider: LanguageProvider, logger: sdk.Logger) => async (
  input: string,
  lang: string,
  slotDefinitions: sdk.NLU.SlotDefinition[],
  intentName: string = '',
  contexts: string[] = []
): Promise<TrainingSequence> => {
  let tokens: Token[] = []
  const genToken = _generateTrainingTokens(langProvider)
  const cannonical = keepEntityValues(input)
  const knownSlots = getKnownSlots(input, slotDefinitions, logger)

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
