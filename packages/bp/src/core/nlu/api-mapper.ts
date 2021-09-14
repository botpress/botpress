import {
  PredictOutput as StanPredictOutput,
  IntentPrediction as StanIntentPrediction,
  SlotPrediction as StanSlotPrediction,
  ContextPrediction as StanContextPrediction,
  EntityPrediction as StanEntityPrediction
} from '@botpress/nlu-client'
import { NLU as SDKNLU } from 'botpress/sdk'
import _ from 'lodash'

export interface BpPredictOutput {
  entities: SDKNLU.Entity[]
  predictions: Dic<SDKNLU.ContextPrediction>
  spellChecked: string
}
type BpSlotPrediction = SDKNLU.Slot
type BpIntentPrediction = SDKNLU.ContextPrediction['intents'][0]
type BpEntityPrediction = SDKNLU.Entity
type BpContextPrediction = SDKNLU.ContextPrediction

function mapEntity(entity: StanEntityPrediction): BpEntityPrediction {
  const { name, type, start, end, confidence, source, value, unit } = entity

  return {
    name,
    type,
    meta: {
      confidence,
      start,
      end,
      sensitive: false,
      source
    },
    data: {
      unit: unit!,
      value
    }
  }
}

function mapIntent(intent: StanIntentPrediction): BpIntentPrediction {
  const { confidence, slots, extractor, name } = intent
  return {
    label: name,
    confidence,
    extractor,
    slots: _(slots)
      .map(mapOutputSlot)
      .keyBy(s => s.name)
      .value()
  }
}

function mapOutputSlot(slot: StanSlotPrediction): BpSlotPrediction {
  const { confidence, start, end, value, source, name, entity } = slot

  return {
    confidence,
    start,
    end,
    entity: entity && mapEntity(entity),
    name,
    source,
    value
  }
}

function mapContext(context: StanContextPrediction): BpContextPrediction {
  const { confidence, oos, intents } = context

  return {
    confidence,
    oos,
    intents: intents.map(mapIntent)
  }
}

export const mapPredictOutput = (predictOutput: StanPredictOutput): BpPredictOutput => {
  const { contexts, spellChecked, entities } = predictOutput
  return {
    predictions: _(contexts)
      .keyBy(c => c.name)
      .mapValues(mapContext)
      .value(),
    spellChecked,
    entities: entities.map(mapEntity)
  }
}
