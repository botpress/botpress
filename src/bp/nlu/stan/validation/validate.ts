import { validate } from 'joi'
import * as NLUEngine from 'nlu/engine'
import { isListEntity, isPatternEntity } from '../api-mapper'

import {
  IntentDefinition,
  ListEntityDefinition,
  PatternEntityDefinition,
  PredictInput,
  SlotDefinition,
  TrainInput
} from '../typings_v1'

import { CancelInputSchema, PredictInputSchema, TrainInputSchema } from './schemas'

const SLOT_ANY = 'any'

const makeSlotChecker = (listEntities: ListEntityDefinition[], patternEntities: PatternEntityDefinition[]) => (
  variable: SlotDefinition
) => {
  const { entities, name } = variable

  const supportedTypes = [
    ...listEntities.map(e => e.name),
    ...patternEntities.map(p => p.name),
    ...NLUEngine.SYSTEM_ENTITIES,
    SLOT_ANY
  ]
  for (const entity of entities) {
    if (!supportedTypes.includes(entity)) {
      throw new Error(`Slot ${name} references entity ${entity}, but it does not exist.`)
    }
  }
}

const makeIntentChecker = (contexts: string[]) => (
  intent: IntentDefinition,
  enums: ListEntityDefinition[],
  patterns: PatternEntityDefinition[]
) => {
  for (const ctx of intent.contexts) {
    if (!contexts.includes(ctx)) {
      throw new Error(`Context ${ctx} of Intent ${intent.name} does not seem to appear in all contexts`)
    }
  }
  const variableChecker = makeSlotChecker(enums, patterns)
  intent.slots.forEach(variableChecker)
}

export async function validateTrainInput(rawInput: any): Promise<TrainInput> {
  const validatedInput: TrainInput = await validate(rawInput, TrainInputSchema, {})

  const { entities, contexts } = validatedInput

  const listEntities = entities.filter(isListEntity)
  const patternEntities = entities.filter(isPatternEntity)

  const validateIntent = makeIntentChecker(contexts)

  for (const intent of validatedInput.intents) {
    validateIntent(intent, listEntities, patternEntities)
  }

  return validatedInput
}

export async function validateCancelRequestInput(rawInput: any): Promise<{ password: string }> {
  const validated: { password: string } = await validate(rawInput, CancelInputSchema, {})
  return validated
}

export async function validatePredictInput(rawInput: any): Promise<PredictInput> {
  const validated: PredictInput = await validate(rawInput, PredictInputSchema, {})
  return validated
}
