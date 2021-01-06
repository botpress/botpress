import { validate } from 'joi'
import { DUCKLING_ENTITIES } from 'nlu-core/entities/duckling-extractor'
import { isListEntity, isPatternEntity } from 'nlu-server/api-mapper'

import {
  IntentDefinition,
  ListEntityDefinition,
  PatternEntityDefinition,
  SlotDefinition,
  TrainInput
} from '../typings_v1'

import { TrainInputSchema } from './schemas'

const SLOT_ANY = 'any'

const makeVariableChecker = (enums: ListEntityDefinition[], patterns: PatternEntityDefinition[]) => (
  variable: SlotDefinition
) => {
  const { entities, name } = variable

  const supportedTypes = [...enums.map(e => e.name), ...patterns.map(p => p.name), ...DUCKLING_ENTITIES, SLOT_ANY]
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
  const variableChecker = makeVariableChecker(enums, patterns)
  intent.slots.forEach(variableChecker)
}

async function validateInput(rawInput: any): Promise<TrainInput> {
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

export default validateInput
