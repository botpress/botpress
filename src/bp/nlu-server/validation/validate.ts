import { validate } from 'joi'

import { Enum, Intent, Pattern, TrainInput, Variable } from '../typings'

import extractVariables from './extractVariables'
import { TrainInputSchema } from './schemas'

const makeVariableChecker = (enums: Enum[], patterns: Pattern[]) => (variable: Variable) => {
  const { type, name } = variable

  const supportedTypes = [...enums.map(e => e.name), ...patterns.map(p => p.name)]
  if (!supportedTypes.includes(type)) {
    throw new Error(`Variable ${name} references variable type ${type}, but it does not exist.`)
  }
}

const makeExampleChecker = (supportedVariables: Variable[]) => (example: string) => {
  const variables = extractVariables(example)

  for (const v of variables) {
    if (!supportedVariables.map(v => v.name).includes(v)) {
      throw new Error(`Variable $${v} does not reference an existing variable definition.`)
    }
  }
}

function validateIntent(intent: Intent, enums: Enum[], patterns: Pattern[]) {
  const exampleChecker = makeExampleChecker(intent.variables)
  const variableChecker = makeVariableChecker(enums, patterns)
  intent.examples.forEach(exampleChecker)
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
