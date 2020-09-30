import { Enum, Intent, Pattern, Topic, TrainInput, Variable } from '../typings'

import validateInput from './validate'

/**
 * These unit tests don't cover all possible scenarios of training input, but they to more good than bad.
 * If we ever find a bug in train input validation, we'll just add some more tests.
 */

async function assertThrows(fn: () => Promise<any>, msg: string = '') {
  let errorThrown = false
  try {
    await fn()
  } catch {
    errorThrown = true
  }

  if (!errorThrown) {
    console.log(`Didn't throw: ${msg}`) // for debug purposes
  }
  expect(errorThrown).toBe(true)
}

const CITY_ENUM: Enum = {
  name: 'city',
  fuzzy: 1,
  values: [
    { name: 'paris', synonyms: ['city of paris', 'la ville des lumières'] },
    { name: 'quebec', synonyms: [] }
  ]
}

const TICKET_PATTERN: Pattern = {
  name: 'ticket',
  case_sensitive: true,
  positive_regexes: ['[A-Z]{3}-[0-9]{3}'] // ABC-123
}

const VARIABLE_CITY_FROM: Variable = { name: 'city-from', type: 'city' }

const VARIABLE_TICKET_PROBLEM: Variable = { name: 'tick-with-problem', type: 'ticket' }

const INTENT_FLY: Intent = {
  name: 'fly',
  examples: ['fly from $city-from to anywhere', 'book a flight'],
  variables: [VARIABLE_CITY_FROM]
}

const INTENT_PROBLEM: Intent = {
  name: 'problem',
  examples: ['problem with ticket $tick-with-problem', 'problem with ticket'],
  variables: [VARIABLE_TICKET_PROBLEM]
}

const EMPTY_INTENT: Intent = {
  name: 'empty',
  examples: ['hahahahahahaha'],
  variables: []
}

const FLY_TOPIC: Topic = { name: 'fly', intents: [INTENT_FLY] }

const PROBLEM_TOPIC: Topic = { name: 'problem', intents: [INTENT_PROBLEM] }

const EMPTY_TOPIC: Topic = { name: 'empty', intents: [EMPTY_INTENT] }

const LANG = 'en'
const PW = 'Caput Draconis'

test('validate with correct format should pass', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    seed: 42
  }

  // act
  const validated = await validateInput(trainInput)

  // assert
  expect(validated).toStrictEqual(trainInput)
})

test('validate without pw should set pw as empty string', async () => {
  // arrange
  const trainInput: Partial<TrainInput> = {
    topics: [FLY_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    patterns: [],
    seed: 42
  }

  // act
  const validated = await validateInput(trainInput)

  // assert
  expect(validated.password).toBe('')
})

test('validate input without enums and patterns should pass', async () => {
  // arrange
  const trainInput: Omit<TrainInput, 'enums' | 'patterns'> = {
    topics: [EMPTY_TOPIC],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act
  const validated = await validateInput(trainInput)

  // assert
  const expected: TrainInput = { ...trainInput, enums: [], patterns: [] }
  expect(validated).toStrictEqual(expected)
})

test('validate input without topics or language should throw', async () => {
  // arrange
  const withoutTopic: Omit<TrainInput, 'enums' | 'patterns' | 'topics'> = {
    language: LANG,
    password: PW,
    seed: 42
  }

  const withoutLang: Omit<TrainInput, 'enums' | 'patterns' | 'language'> = {
    topics: [FLY_TOPIC],
    password: PW,
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(withoutTopic), 'withoutTopic')
  await assertThrows(() => validateInput(withoutLang), 'withoutLang')
})

test('validate without intent should fail', async () => {
  // arrange
  const withoutIntent: Topic = { name: 'will break' } as Topic

  const trainInput: TrainInput = {
    topics: [withoutIntent],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(trainInput), 'withoutIntent')
})

test('validate enum without values or patterns without regexes should fail', async () => {
  // arrange
  const incompleteEnum: Enum = { name: 'city' } as Enum

  const incompletePattern: Pattern = { name: 'password' } as Pattern

  const withoutValues: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [incompleteEnum],
    language: LANG,
    password: PW,
    patterns: [],
    seed: 42
  }

  const withoutRegexes: TrainInput = {
    topics: [PROBLEM_TOPIC],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [incompletePattern],
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(withoutValues), 'withoutValues')
  await assertThrows(() => validateInput(withoutRegexes), 'withoutRegexes')
})

test('validate with an unexisting referenced enum should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [TICKET_PATTERN],
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(trainInput), 'withoutCities')
})

test('validate with an unexisting referenced pattern should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [PROBLEM_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(trainInput), 'withoutTickets')
})

test('validate with an unexisting referenced variable should throw', async () => {
  // arrange
  const withoutTicketProblem: Intent = {
    name: 'problem',
    examples: ['problem with ticket $tick-with-problem', 'problem with ticket'],
    variables: []
  }
  const topic: Topic = { name: 'problem', intents: [withoutTicketProblem] }

  const trainInput: TrainInput = {
    topics: [topic],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [TICKET_PATTERN],
    seed: 42
  }

  // act & assert
  await assertThrows(() => validateInput(trainInput), 'withoutTicketProblem')
})

test('validate with correct format but unexpected property should fail', async () => {
  // arrange
  const trainInput: TrainInput & { entities: any[] } = {
    topics: [FLY_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    seed: 42,
    entities: []
  }

  // act & assert
  await assertThrows(() => validateInput(trainInput), 'oneExtraKey')
})
