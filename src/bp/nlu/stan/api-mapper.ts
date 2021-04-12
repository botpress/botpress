import _ from 'lodash'

import NLUEngine, {
  ContextPrediction,
  EntityPrediction,
  IntentDefinition,
  IntentPrediction,
  ListEntityDefinition,
  PatternEntityDefinition,
  PredictOutput,
  SlotDefinition,
  SlotPrediction,
  TrainInput
} from '../typings_v1'

export interface BpTrainInput {
  intents: NLUEngine.IntentDefinition[]
  entities: NLUEngine.EntityDefinition[]
  contexts: string[]
  language: string
  password: string
  seed?: number
}

export interface BpPredictOutput {
  entities: NLUEngine.EntityPrediction[]
  contexts: _.Dictionary<NLUEngine.ContextPrediction>
  spellChecked: string
  detectedLanguage: string
  utterance: string
}

interface BpIntentPred {
  name: string
  confidence: number
  // slots: _.Dictionary<NLUEngine.SlotPrediction>
  slots: SlotPrediction[]
  extractor: string
}

export const isListEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is ListEntityDefinition => {
  return e.type === 'list'
}

export const isPatternEntity = (e: ListEntityDefinition | PatternEntityDefinition): e is PatternEntityDefinition => {
  return e.type === 'pattern'
}

const mapInputSlot = (slot: SlotDefinition): NLUEngine.SlotDefinition => {
  return slot
}

const makeIntentMapper = (ctx: string, lang: string) => (intent: IntentDefinition): NLUEngine.IntentDefinition => {
  return intent
}

const mapList = (listDef: ListEntityDefinition): NLUEngine.EntityDefinition => {
  return listDef
}

const mapPattern = (patternDef: PatternEntityDefinition): NLUEngine.EntityDefinition => {
  return patternDef
}

export function mapTrainInput(trainInput: TrainInput): BpTrainInput {
  return trainInput
}

function mapEntity(entity: NLUEngine.EntityPrediction): EntityPrediction {
  return entity
}

function mapIntent(intent: BpIntentPred): IntentPrediction {
  return intent
}

function mapOutputSlot(slot: NLUEngine.SlotPrediction): SlotPrediction {
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

function mapContext(context: NLUEngine.ContextPrediction, name: string): ContextPrediction {
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
