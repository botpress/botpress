import { validate } from 'joi'

import { Complex, Enum, Intent, Pattern, TrainInput, Variable } from '../typings'

import extractVariables from './extractVariables'
import { TrainInputSchema } from './schemas'

const makeVariableChecker = (enums: Enum[], patterns: Pattern[], complexes: Complex[]) => (variable: Variable) => {
  const { type, name } = variable

  const supportedTypes = [...enums.map(e => e.name), ...patterns.map(p => p.name), ...complexes.map(c => c.name)]
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

function validateIntent(intent: Intent, enums: Enum[], patterns: Pattern[], complexes: Complex[]) {
  const exampleChecker = makeExampleChecker(intent.variables)
  const variableChecker = makeVariableChecker(enums, patterns, complexes)
  intent.examples.forEach(exampleChecker)
  intent.variables.forEach(variableChecker)
}

function validateComplex(complex: Complex, allEnums: Enum[], allPatterns: Pattern[]) {
  const { name, enums, patterns, examples } = complex

  if (![enums, patterns, examples].some(arr => arr.length)) {
    throw new Error(`Complex ${name} is empty. A complex must either have enums, patterns or examples.`)
  }

  const enumsNames = allEnums.map(e => e.name)
  for (const e of enums) {
    if (!enumsNames.includes(e)) {
      throw new Error(`Complex ${complex.name} references enum ${e}, but it does not exist.`)
    }
  }

  const patternsNames = allPatterns.map(p => p.name)
  for (const p of patterns) {
    if (!patternsNames.includes(p)) {
      throw new Error(`Complex ${complex.name} references pattern ${p}, but it does not exist.`)
    }
  }
}

async function validateInput(rawInput: any): Promise<TrainInput> {
  const validatedInput: TrainInput = await validate(rawInput, TrainInputSchema, {})

  const { enums, patterns, complexes } = validatedInput
  for (const complex of complexes) {
    validateComplex(complex, enums, patterns)
  }

  for (const ctx of validatedInput.topics) {
    for (const intent of ctx.intents) {
      validateIntent(intent, enums, patterns, complexes)
    }
  }

  return validatedInput
}

export default validateInput
