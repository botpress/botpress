import { Enum, Intent, Pattern, Topic, TrainInput, Variable } from '../typings'

import validateInput from './validate'

/**
 * These unit tests don't cover all possible scenarios of training input, but they to more good than bad.
 * If we ever find a bug in train input validation, we'll just add some more tests.
 */

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
  regex: '[A-Z]{3}-[0-9]{3}', // ABC-123
  examples: ['ABC-123']
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

const BOUILLON_TOPIC: Topic = {
  name: 'bouillon',
  intents: [
    {
      name: 'vote restaurant',
      examples: ['I vote for $restaurant-to-vote'],
      variables: [{ name: 'restaurant-to-vote', type: 'restaurant' }]
    }
  ]
}

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
    complexes: [],
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

test('validate with empty string pw should be allowed', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    patterns: [],
    complexes: [],
    seed: 42,
    password: ''
  }

  // act
  const validated = await validateInput(trainInput)

  // assert
  expect(validated.password).toBe('')
})

test('validate input without enums and patterns should pass', async () => {
  // arrange
  const trainInput: Omit<TrainInput, 'enums' | 'patterns' | 'complexes'> = {
    topics: [EMPTY_TOPIC],
    language: LANG,
    password: PW,
    seed: 42
  }

  // act
  const validated = await validateInput(trainInput)

  // assert
  const expected: TrainInput = { ...trainInput, enums: [], patterns: [], complexes: [] }
  expect(validated).toStrictEqual(expected)
})

test('validate input without topics or language should throw', async () => {
  // arrange
  const withoutTopic: Omit<TrainInput, 'enums' | 'patterns' | 'topics' | 'complexes'> = {
    language: LANG,
    password: PW,
    seed: 42
  }

  const withoutLang: Omit<TrainInput, 'enums' | 'patterns' | 'language' | 'complexes'> = {
    topics: [FLY_TOPIC],
    password: PW,
    seed: 42
  }

  // act & assert
  await expect(validateInput(withoutTopic)).rejects.toThrow()
  await expect(validateInput(withoutLang)).rejects.toThrow()
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
    complexes: [],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate enum without values or patterns without regexes or empty complex should fail', async () => {
  // arrange
  const incompleteEnum: Enum = { name: 'city' } as Enum

  const incompletePattern: Pattern = { name: 'password' } as Pattern

  const withoutValues: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [incompleteEnum],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [],
    seed: 42
  }

  const withoutRegexes: TrainInput = {
    topics: [PROBLEM_TOPIC],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [incompletePattern],
    complexes: [],
    seed: 42
  }

  const emptyComplex: TrainInput = {
    topics: [BOUILLON_TOPIC],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [{ name: 'restaurant', enums: [], patterns: [], examples: [] }],
    seed: 42
  }

  // act & assert
  await expect(validateInput(withoutValues)).rejects.toThrow()
  await expect(validateInput(withoutRegexes)).rejects.toThrow()
  await expect(validateInput(emptyComplex)).rejects.toThrow()
})

test('validate with an unexisting referenced enum should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [FLY_TOPIC],
    enums: [],
    language: LANG,
    password: PW,
    patterns: [TICKET_PATTERN],
    complexes: [],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate with an unexisting referenced pattern should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [PROBLEM_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate with an unexisting referenced complex should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [
      {
        name: 'bouillon',
        intents: [
          {
            name: 'vote restaurant',
            examples: ['I vote for $restaurant-to-vote'],
            variables: [{ name: 'restaurant-to-vote', type: 'restaurant' }]
          }
        ]
      }
    ],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
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
    complexes: [],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate with correct format but unexpected property should fail', async () => {
  // arrange
  const trainInput: TrainInput & { entities: any[] } = {
    topics: [FLY_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [],
    seed: 42,
    entities: []
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate with a complex referencing an unexisting enum or pattern should throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [BOUILLON_TOPIC],
    enums: [CITY_ENUM],
    language: LANG,
    password: PW,
    patterns: [],
    complexes: [{ name: 'restaurant', examples: [], patterns: ['postal-code'], enums: ['known-restaurant'] }],
    seed: 42
  }

  // act & assert
  await expect(validateInput(trainInput)).rejects.toThrow()
})

test('validate with a complex referencing an enum and pattern should not throw', async () => {
  // arrange
  const trainInput: TrainInput = {
    topics: [BOUILLON_TOPIC],
    enums: [
      {
        name: 'known-restaurant',
        values: [
          { name: 'burger king', synonyms: ['BK'] },
          { name: 'mcdo', synonyms: ['donald'] }
        ],
        fuzzy: 1
      }
    ],
    language: LANG,
    password: PW,
    patterns: [{ name: 'postal-code', regex: '\\w{6}', case_sensitive: false, examples: [] }],
    complexes: [{ name: 'restaurant', examples: [], patterns: ['postal-code'], enums: ['known-restaurant'] }],
    seed: 42
  }

  // act
  const validated = await validateInput(trainInput)

  //  assert
  expect(validated).toStrictEqual(trainInput)
})
