import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import {
  ContextPrediction,
  EntityPrediction,
  EntityType,
  IntentDefinition,
  IntentPrediction,
  ListEntityDefinition,
  PatternEntityDefinition,
  PredictOutput,
  SlotDefinition,
  SlotPrediction,
  TrainInput
} from './typings_v1'

export interface BpTrainInput {
  intents: NLU.IntentDefinition[]
  entities: NLU.EntityDefinition[]
  contexts: string[]
  language: string
  password: string
  seed?: number
}

export interface BpPredictOutput {
  entities: NLU.Entity[]
  contexts: _.Dictionary<NLU.ContextPrediction>
  spellChecked: string
  detectedLanguage: string
  utterance: string
}

interface BpIntentPred {
  label: string
  confidence: number
  slots: _.Dictionary<NLU.Slot>
  extractor: 'exact-matcher' | 'classifier'
}

export const isListEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is ListEntityDefinition => {
  return e.type === 'list'
}

export const isPatternEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is PatternEntityDefinition => {
  return e.type === 'pattern'
}

const mapInputSlot = (slot: SlotDefinition): NLU.SlotDefinition => {
  const { name, entities } = slot
  return {
    id: name,
    entities,
    name,
    color: 0
  }
}

const makeIntentMapper = (ctx: string, lang: string) => (intent: IntentDefinition): NLU.IntentDefinition => {
  const { name, utterances, slots } = intent

  return {
    contexts: [ctx],
    filename: '',
    name,
    utterances: {
      [lang]: utterances
    },
    slots: slots.map(mapInputSlot)
  }
}

const mapList = (listDef: ListEntityDefinition): NLU.EntityDefinition => {
  const { name, fuzzy, values } = listDef

  return {
    id: name,
    name,
    type: 'list',
    fuzzy,
    occurrences: values
  }
}

const mapPattern = (patternDef: PatternEntityDefinition): NLU.EntityDefinition => {
  const { name, regex, case_sensitive } = patternDef

  return {
    id: name,
    name,
    type: 'pattern',
    pattern: regex,
    matchCase: case_sensitive
  }
}

export function mapTrainInput(trainInput: TrainInput): BpTrainInput {
  const { language, contexts, entities, seed, password, intents } = trainInput

  const listEntities = entities.filter(isListEntity).map(mapList)
  const patternEntities = entities.filter(isPatternEntity).map(mapPattern)

  const _intents: NLU.IntentDefinition[] = _.flatMap(contexts, ctx => {
    const intentMapper = makeIntentMapper(ctx, language)
    return intents.filter(i => i.contexts.includes(ctx)).map(intentMapper)
  })

  return {
    language,
    entities: [...listEntities, ...patternEntities],
    contexts,
    intents: _intents,
    seed,
    password
  }
}

function mapEntity(entity: NLU.Entity): EntityPrediction {
  const { data, type, meta, name } = entity
  const { unit, value } = data
  const { confidence, start, end, source } = meta

  return {
    name,
    type,
    start,
    end,
    confidence,
    source,
    value,
    unit
  }
}

function mapIntent(intent: BpIntentPred): IntentPrediction {
  const { confidence, slots, extractor, label } = intent

  return {
    name: label,
    confidence,
    extractor,
    slots: Object.values(slots).map(mapOutputSlot)
  }
}

function mapOutputSlot(slot: NLU.Slot): SlotPrediction {
  const { confidence, start, end, value, source, name, entity } = slot

  return {
    confidence,
    start,
    end,
    entity: entity ? mapEntity(entity) : null,
    name,
    source,
    value
  }
}

function mapContext(context: NLU.ContextPrediction, name: string): ContextPrediction {
  const { confidence, intents, oos } = context

  return {
    name,
    confidence,
    oos,
    intents: intents.map(mapIntent)
  }
}

const N_DIGITS = 3

const _roundConfidencesTo3Digits = (output: PredictOutput): PredictOutput => {
  const contexts = output.contexts.map(context => {
    context.confidence = _.round(context.confidence, N_DIGITS)
    context.oos = _.round(context.oos, N_DIGITS)
    context.intents = context.intents.map(i => {
      const slots = i.slots.map(s => ({ ...s, confidence: _.round(s.confidence, N_DIGITS) }))
      return { ...i, confidence: _.round(i.confidence, N_DIGITS), slots }
    })
    return context
  })
  return { ...output, contexts }
}

export function mapPredictOutput(output: BpPredictOutput): PredictOutput {
  const { entities, contexts, utterance, detectedLanguage, spellChecked } = output

  const ret = {
    entities: entities.map(mapEntity),
    contexts: Object.entries(contexts).map(([name, ctx]) => mapContext(ctx, name)),
    detectedLanguage,
    spellChecked,
    utterance
  }
  return _roundConfidencesTo3Digits(ret)
}
