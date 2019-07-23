import * as sdk from 'botpress/sdk'

import { makeTokens } from '../../tools/token-utils'
import { KnownSlot, TrainingSequence } from '../../typings'

import ExactMatcher from './exact_matcher'

const I_LIKE_ANIMALS_INTENT = 'I_LIKE_ANIMALS_INTENT'
const ANIMAL_I_LIKE_SLOT = 'ANIMAL_I_LIKE_SLOT'

const ANIMAL_ENTITY = 'ANIMAL_ENTITY'
const FOOD_ENTITY = 'FOOD_ENTITY'
const NUMBER_ENTITY = 'NUMBER_ENTITY'

const SPACE = '\u2581'

function makeSequence(text: string, intent: string, knownSlots?: KnownSlot[], contexts?: string[]): TrainingSequence {
  const tokens = makeTokens(text.split(' ').map(t => SPACE + t), text)

  contexts = contexts || []
  knownSlots = knownSlots || []
  return {
    cannonical: text,
    contexts,
    intent,
    knownSlots,
    tokens
  }
}

const I_like_animals = makeSequence('I like animals', I_LIKE_ANIMALS_INTENT)

const I_like_dogs = makeSequence('I like dogs', I_LIKE_ANIMALS_INTENT, [
  {
    name: ANIMAL_I_LIKE_SLOT,
    entities: [ANIMAL_ENTITY],
    start: 7,
    end: 11,
    source: 'dogs'
  }
])

const I_like_69_pretty_dogs = makeSequence('I like 69 pretty dogs', I_LIKE_ANIMALS_INTENT, [
  {
    name: 'number_of_animals',
    entities: [NUMBER_ENTITY],
    start: 7,
    end: 9,
    source: '69'
  },
  {
    name: ANIMAL_I_LIKE_SLOT,
    entities: [ANIMAL_ENTITY],
    start: 17,
    end: 21,
    source: 'dogs'
  }
])

describe('Exact Match', () => {
  test('exact match with actual exact match should return correct intent', async () => {
    // Arrange
    const trainingSet: TrainingSequence[] = []
    trainingSet.push(I_like_animals)

    const exactMatcher = new ExactMatcher(trainingSet)

    const ds = {
      sanitizedText: 'I like animals',
      includedContexts: [],
      entities: []
    }

    // Act
    const intent = exactMatcher.exactMatch(ds) as sdk.NLU.Intent

    // Assert
    expect(intent).toBeDefined()
    expect(intent!.name).toBe(I_LIKE_ANIMALS_INTENT)
    expect(intent.confidence).toEqual(1)
  })

  test('exact match with match except for one slot of same entity should return correct intent', async () => {
    // Arrange
    const trainingSet: TrainingSequence[] = []
    trainingSet.push(I_like_animals)
    trainingSet.push(I_like_dogs)

    const exactMatcher = new ExactMatcher(trainingSet)

    const ds = {
      sanitizedText: 'I like dogs',
      includedContexts: [],
      entities: [
        {
          name: ANIMAL_ENTITY,
          data: {},
          meta: {
            start: 7,
            end: 11
          },
          type: 'list'
        } as sdk.NLU.Entity
      ]
    }

    // Act
    const intent = exactMatcher.exactMatch(ds) as sdk.NLU.Intent

    // Assert
    expect(intent).toBeDefined()
    expect(intent!.name).toBe(I_LIKE_ANIMALS_INTENT)
    expect(intent.confidence).toEqual(1)
  })

  test('exact match with match except for one slot of different entity should not match', async () => {
    // Arrange
    const trainingSet: TrainingSequence[] = []
    trainingSet.push(I_like_animals)
    trainingSet.push(I_like_dogs)

    const exactMatcher = new ExactMatcher(trainingSet)

    const ds = {
      sanitizedText: 'I like tomatos',
      includedContexts: [],
      entities: [
        {
          name: FOOD_ENTITY,
          data: {},
          meta: {
            start: 7,
            end: 14
          },
          type: 'list'
        } as sdk.NLU.Entity
      ]
    }

    // Act
    const intent = exactMatcher.exactMatch(ds) as sdk.NLU.Intent

    // Assert
    expect(intent).toBeUndefined()
  })

  test('exact match with match for more than one slot should not match', async () => {
    // Arrange
    const trainingSet: TrainingSequence[] = []
    trainingSet.push(I_like_animals)
    trainingSet.push(I_like_dogs)
    trainingSet.push(I_like_69_pretty_dogs)

    const exactMatcher = new ExactMatcher(trainingSet)

    const ds = {
      sanitizedText: 'I like 42 stupid dogs',
      includedContexts: [],
      entities: [
        {
          name: NUMBER_ENTITY,
          data: {},
          meta: {
            start: 7,
            end: 9
          },
          type: 'list'
        } as sdk.NLU.Entity,
        {
          name: ANIMAL_ENTITY,
          data: {},
          meta: {
            start: 17,
            end: 21
          },
          type: 'list'
        } as sdk.NLU.Entity
      ]
    }

    // Act
    const intent = exactMatcher.exactMatch(ds) as sdk.NLU.Intent

    // Assert
    expect(intent).toBeUndefined()
  })
})
