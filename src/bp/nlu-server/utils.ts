import { NLU } from 'botpress/sdk'
import _ from 'lodash'

import { Enum, Intent, Pattern, TrainInput, Variable } from './typings'

interface BpTrainInput {
  intents: NLU.IntentDefinition[]
  entities: NLU.EntityDefinition[]
  language: string
  password: string
  seed?: number
}

const mapVariable = (variable: Variable): NLU.SlotDefinition => {
  const { name, variableType } = variable
  return {
    entity: variableType,
    name
  }
}

const makeIntentMapper = (ctx: string, lang: string) => (intent: Intent): NLU.IntentDefinition => {
  const { name, examples, variables } = intent

  return {
    contexts: [ctx],
    filename: '',
    name,
    utterances: {
      [lang]: examples
    },
    slots: variables.map(mapVariable)
  }
}

const mapEnum = (enumDef: Enum): NLU.EntityDefinition => {
  const { name, fuzzy, values } = enumDef

  return {
    id: name,
    name,
    list_entities: [],
    pattern_entities: [],
    type: 'list',
    fuzzy,
    occurrences: values
  }
}

const mapPattern = (pattern: Pattern): NLU.EntityDefinition => {
  const { name, positive_regexes, case_sensitive } = pattern

  return {
    id: name,
    name,
    list_entities: [],
    pattern_entities: [],
    type: 'pattern',
    pattern: positive_regexes[0], // TODO: adress this type mismatch...
    matchCase: case_sensitive
  }
}

export function mapTrainInput(trainInput: TrainInput): BpTrainInput {
  const { language, topics, enums, patterns, seed, password } = trainInput

  const listEntities = enums.map(mapEnum)
  const patternEntities = patterns.map(mapPattern)
  const entities = [...listEntities, ...patternEntities]

  const intents: NLU.IntentDefinition[] = _.flatMap(topics, t => {
    const intentMapper = makeIntentMapper(t.name, language)
    return t.intents.map(intentMapper)
  })

  return {
    language,
    entities,
    intents,
    seed,
    password
  }
}
