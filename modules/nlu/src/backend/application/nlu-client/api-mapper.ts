import {
  TrainInput,
  ListEntityDefinition,
  PatternEntityDefinition,
  EntityDefinition as StanEntityDefinition,
  SlotDefinition as StanSlotDefinition,
  IntentDefinition as StanIntentDefinition
} from '@botpress/nlu-client'

import { NLU as SDKNLU } from 'botpress/sdk'
import _ from 'lodash'
import { TrainingSet as BpTrainingSet } from '../typings'

type BpSlotDefinition = SDKNLU.SlotDefinition
type BpIntentDefinition = SDKNLU.IntentDefinition
type BpEntityDefinition = SDKNLU.EntityDefinition

/**
 * ################
 * ### Training ###
 * ################
 */

const isListEntity = (e: BpEntityDefinition) => {
  return e.type === 'list'
}

const isPatternEntity = (e: BpEntityDefinition) => {
  return e.type === 'pattern'
}

const isCustomEntity = (e: BpEntityDefinition) => {
  return isListEntity(e) || isPatternEntity(e)
}

const mapInputSlot = (slot: BpSlotDefinition): StanSlotDefinition => {
  const { name, entities } = slot
  return {
    name,
    entities
  }
}

const makeIntentMapper = (lang: string) => (intent: BpIntentDefinition): StanIntentDefinition => {
  const { contexts, name, utterances, slots } = intent
  return {
    contexts,
    name,
    utterances: utterances[lang],
    slots: slots.map(mapInputSlot)
  }
}

const mapList = (listDef: BpEntityDefinition): ListEntityDefinition => {
  const { name, fuzzy, occurrences, examples } = listDef

  return {
    name,
    type: 'list',
    fuzzy: fuzzy!,
    values: occurrences!
  }
}

const mapPattern = (patternDef: BpEntityDefinition): PatternEntityDefinition => {
  const { name, pattern, matchCase, examples } = patternDef

  return {
    name,
    type: 'pattern',
    regex: pattern!,
    case_sensitive: matchCase!,
    examples: examples ?? []
  }
}

const mapEntityDefinition = (e: BpEntityDefinition): StanEntityDefinition => {
  return isPatternEntity(e) ? mapPattern(e) : mapList(e)
}

export const mapTrainSet = (bpTrainSet: BpTrainingSet): TrainInput => {
  const { intentDefs, entityDefs, languageCode, seed } = bpTrainSet

  const entities = entityDefs.filter(isCustomEntity).map(mapEntityDefinition)

  const intentMapper = makeIntentMapper(languageCode)
  const intents = intentDefs.map(intentMapper)

  return {
    intents,
    entities,
    language: languageCode,
    seed
  }
}
