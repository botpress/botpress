import * as sdk from 'botpress/sdk'
import { HintService } from './hint'
import PatternExtractor from './pipelines/entities/pattern_extractor'
import Storage from './storage'
import { EntityExtractor, SlotValidation } from './typings'
import _ from 'lodash'

function createEntityExtractorMock(validList: boolean, validPattern: boolean) {
  const validateListEntityOccurence = jest.fn().mockResolvedValue(validList)
  const validatePatternEntityOccurence = jest.fn().mockResolvedValue(validPattern)

  const extractor: Partial<PatternExtractor> = {
    validateListEntityOccurence,
    validatePatternEntityOccurence
  }

  return extractor
}

function createDucklingExtractorMock(isValid: boolean): Partial<EntityExtractor> {
  return { validate: jest.fn().mockResolvedValue(isValid) }
}

function createStorage(intents: sdk.NLU.IntentDefinition[]): Partial<Storage> {
  const getIntent = jest.fn(i => Promise.resolve(intents.find(x => x.name === i)))

  return {
    getIntent,
    getCustomEntities,
    getSystemEntities,
    getAvailableEntities
  }
}

const fruitsEntity = {
  id: 'fruits',
  name: 'fruits',
  type: 'list',
  fuzzy: true,
  occurences: [
    {
      name: 'bananas',
      synonyms: ['banana']
    },
    {
      name: 'apples',
      synonyms: ['apple']
    },
    {
      name: 'watermelon',
      synonyms: ['water melon', 'water-melon', 'melon']
    }
  ]
} as sdk.NLU.EntityDefinition

const patternEntity = {
  id: 'onetwothree',
  name: 'superRegidAdministationPatternThing',
  type: 'pattern',
  pattern: '^123.{5}321$'
} as sdk.NLU.EntityDefinition

const numberEntity = {
  id: 'number',
  name: 'number',
  type: 'system'
} as sdk.NLU.EntityDefinition

const customEntities = [fruitsEntity, patternEntity]
const systemEntities = [numberEntity]

const getCustomEntities = jest.fn().mockResolvedValue(customEntities)
const getSystemEntities = jest.fn(() => systemEntities)
const getAvailableEntities = jest.fn().mockResolvedValue([...customEntities, ...systemEntities])

describe('hint service', () => {
  test('validating intent with one slot of list entity should call entity extractor to validate list', async () => {
    // Arrange
    const extractor: PatternExtractor = createEntityExtractorMock(true, false) as PatternExtractor
    const { validateListEntityOccurence, validatePatternEntityOccurence } = extractor

    const duck: EntityExtractor = createDucklingExtractorMock(false) as EntityExtractor
    const { validate: validateSystemEntityOccurence } = duck

    const thingsToBuySlot: sdk.NLU.SlotDefinition = {
      name: 'things-to-buy',
      color: 1,
      entities: [fruitsEntity.name]
    }
    const utt = `I wanna buy a [banana](${thingsToBuySlot.name})`
    const intent: sdk.NLU.IntentDefinition = {
      contexts: [],
      filename: 'ok.json',
      name: 'ok',
      slots: [thingsToBuySlot],
      utterances: {
        ['en']: [utt]
      }
    }
    const storage: Storage = createStorage([intent]) as Storage

    const hint = new HintService('bot', storage as Storage, extractor, duck)

    // Act
    const validation = await hint.validateIntentSlots('ok', 'en')

    // Assert
    const expectedValidation: Partial<SlotValidation> = {
      name: thingsToBuySlot.name,
      start: 14,
      end: 20,
      source: 'banana',
      isValidEntity: true
    }

    const { slots } = validation[utt]
    const actualValidation = _.pick(slots[0], 'name', 'start', 'end', 'source', 'isValidEntity')

    expect(actualValidation).toEqual(expectedValidation)
    expect(validateListEntityOccurence).toBeCalled()
    expect(validatePatternEntityOccurence).not.toBeCalled()
    expect(validateSystemEntityOccurence).not.toBeCalled()
  })

  test('validating intent with one slot of pattern entity should call entity extractor to validate pattern', async () => {
    // Arrange
    const extractor: PatternExtractor = createEntityExtractorMock(false, true) as PatternExtractor
    const { validateListEntityOccurence, validatePatternEntityOccurence } = extractor

    const duck: EntityExtractor = createDucklingExtractorMock(false) as EntityExtractor
    const { validate: validateSystemEntityOccurence } = duck

    const idSlot: sdk.NLU.SlotDefinition = {
      name: 'superStrictId',
      color: 1,
      entities: [patternEntity.name]
    }
    const utt = `Please validate this id: [123-----321](${idSlot.name})`
    const intent: sdk.NLU.IntentDefinition = {
      contexts: [],
      filename: 'validate-id.json',
      name: 'validate-id',
      slots: [idSlot],
      utterances: {
        ['en']: [utt]
      }
    }
    const storage: Storage = createStorage([intent]) as Storage

    const hint = new HintService('bot', storage as Storage, extractor, duck)

    // Act
    const validation = await hint.validateIntentSlots('validate-id', 'en')

    // Assert
    const expectedValidation: Partial<SlotValidation> = {
      name: idSlot.name,
      start: 25,
      end: 36,
      source: '123-----321',
      isValidEntity: true
    }

    const { slots } = validation[utt]
    const actualValidation = _.pick(slots[0], 'name', 'start', 'end', 'source', 'isValidEntity')

    expect(actualValidation).toEqual(expectedValidation)
    expect(validateListEntityOccurence).not.toBeCalled()
    expect(validatePatternEntityOccurence).toBeCalled()
    expect(validateSystemEntityOccurence).not.toBeCalled()
  })

  test('slot any should always be valid', async () => {
    // Arrange
    const extractor: PatternExtractor = createEntityExtractorMock(false, false) as PatternExtractor
    const { validateListEntityOccurence, validatePatternEntityOccurence } = extractor

    const duck: EntityExtractor = createDucklingExtractorMock(false) as EntityExtractor
    const { validate: validateSystemEntityOccurence } = duck

    const superSlot: sdk.NLU.SlotDefinition = {
      name: 'thing-to-kill',
      color: 1,
      entities: [patternEntity.name, fruitsEntity.name, numberEntity.name, 'any']
    }
    const utt = `Kill all the [humans](${superSlot.name})`
    const intent: sdk.NLU.IntentDefinition = {
      contexts: [],
      filename: 'kill-something.json',
      name: 'kill-something',
      slots: [superSlot],
      utterances: {
        ['en']: [utt]
      }
    }
    const storage: Storage = createStorage([intent]) as Storage

    const hint = new HintService('bot', storage as Storage, extractor, duck)

    // Act
    const validation = await hint.validateIntentSlots('kill-something', 'en')

    // Assert
    const expectedValidation: Partial<SlotValidation> = {
      name: superSlot.name,
      start: 13,
      end: 19,
      source: 'humans',
      isValidEntity: true
    }

    const { slots } = validation[utt]
    const actualValidation = _.pick(slots[0], 'name', 'start', 'end', 'source', 'isValidEntity')

    expect(actualValidation).toEqual(expectedValidation)
    expect(validateListEntityOccurence).toBeCalled()
    expect(validatePatternEntityOccurence).toBeCalled()
    expect(validateSystemEntityOccurence).toBeCalled()
  })
})
