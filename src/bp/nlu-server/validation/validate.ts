import { validate } from 'joi'
import { DUCKLING_ENTITIES } from 'nlu-core/entities/duckling-extractor'

import { Enum, Intent, Pattern, TrainInput, Variable } from '../typings'

import { TrainInputSchema } from './schemas'

const SLOT_ANY = 'any'

const makeVariableChecker = (enums: Enum[], patterns: Pattern[]) => (variable: Variable) => {
  const { types, name } = variable

  const supportedTypes = [...enums.map(e => e.name), ...patterns.map(p => p.name), ...DUCKLING_ENTITIES, SLOT_ANY]
  for (const type of types) {
    if (!supportedTypes.includes(type)) {
      throw new Error(`Variable ${name} references variable type ${type}, but it does not exist.`)
    }
  }
}

function validateIntent(intent: Intent, enums: Enum[], patterns: Pattern[]) {
  const variableChecker = makeVariableChecker(enums, patterns)
  intent.variables.forEach(variableChecker)
}

async function validateInput(rawInput: any): Promise<TrainInput> {
  const validatedInput: TrainInput = await validate(rawInput, TrainInputSchema, {})

  const { enums, patterns } = validatedInput

  for (const ctx of validatedInput.topics) {
    for (const intent of ctx.intents) {
      validateIntent(intent, enums, patterns)
    }
  }

  return validatedInput
}

export default validateInput
