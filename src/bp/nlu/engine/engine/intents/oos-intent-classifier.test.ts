import _ from 'lodash'

import { makeFakeTools } from '../test-utils/fake-tools'
import { makeTestUtterance } from '../test-utils/fake-utterance'
import { Intent } from '../typings'
import Utterance from '../utterance/utterance'

import { OOSIntentClassifier } from './oos-intent-classfier'

const languageDimension = 10
const languages = ['en']
const fakeTools = makeFakeTools(languageDimension, languages)
const dummyProgress = (p: number) => {}

const allUtterances: Utterance[] = [
  "You're a wizard Harry",
  'You underestimate my power',
  'You were the chosen one',
  'Take the blue pill',
  'Take the red pill',
  'aaaaaaaa bbbbbbbb',
  'cccccccc dddddddd',
  'never gonna give you up',
  'never gonna let you down'
].map(makeTestUtterance)
const [u1, u2, u3, u4, u5, u6, u7, u8, u9] = allUtterances

const uBetterCheckYoSelf: Utterance = makeTestUtterance('you better check yourself before you wreck yourself')

const makeTrainset = (intents: Intent<Utterance>[]) => {
  return {
    languageCode: 'en',
    list_entities: [],
    pattern_entities: [],
    nluSeed: 42,
    intents,
    allUtterances
  }
}

test('predict with exact match returns confidence 1 for exact-match', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1, u3, u5]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2, u6, u7, u8, u9]
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)

  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const { intents } = await oosIntentClassifier.predict(u1)

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents[0]).toEqual({ name: 'A', confidence: 1, extractor: 'exact-matcher' })
})

test('predict with no exact match returns confidence that sums up to 1', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1, u3, u5]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2, u6, u7, u8, u9]
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)

  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const { intents } = await oosIntentClassifier.predict(uBetterCheckYoSelf)

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents.map(i => i.extractor)).toEqual(['svm-classifier', 'svm-classifier', 'svm-classifier'])
  expect(intents.map(i => i.confidence).some(c => c === 1)).toEqual(false)
})

test('predict with less than min utterances for ml should not match', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2]
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)

  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const { intents } = await oosIntentClassifier.predict(uBetterCheckYoSelf)

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['none'])
  expect(intents.map(i => i.extractor)).toEqual(['svm-classifier'])
  expect(intents.map(i => i.confidence)).toEqual([1])
})

test('predict with available oos should give oos prediction', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2]
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)

  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const { oos } = await oosIntentClassifier.predict(uBetterCheckYoSelf)

  // assert
  expect(oos).toBeGreaterThan(0)
})

test('predict with unavailable oos should return oos 0', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2]
    }
  ]
  const trainSet = makeTrainset(intentsDefs)
  trainSet.languageCode = 'xyz'
  trainSet.allUtterances = trainSet.allUtterances.map(u => u.clone(true, true))
  trainSet.allUtterances.forEach(u => (u.languageCode = 'xyz'))
  await oosIntentClassifier.train(trainSet, dummyProgress)

  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const predictUtt = uBetterCheckYoSelf.clone(true, true)
  predictUtt.languageCode = 'xyz'
  const { oos } = await oosIntentClassifier.predict(predictUtt)

  // assert
  expect(oos).toBe(0)
})

test('When model is corrupted, loading a model throws', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'A',
      contexts: [],
      slot_definitions: [],
      utterances: [u1, u3, u5]
    },
    {
      name: 'B',
      contexts: [],
      slot_definitions: [],
      utterances: [u2, u6, u7, u8, u9]
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)
  const model = oosIntentClassifier.serialize()

  // act & assert
  await expect(oosIntentClassifier.load(`${model} good and bad are relative concepts`)).rejects.toThrowError()

  const parsed = JSON.parse(model)
  parsed['someKey'] = 'someValue'
  await expect(oosIntentClassifier.load(JSON.stringify(parsed))).rejects.toThrowError()

  const undef: unknown = undefined
  await expect(oosIntentClassifier.load(undef as string)).rejects.toThrowError()
})

test('Classifier always pick between exact match or svm', async () => {
  // arrange
  let oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  const intentsDefs = [
    {
      name: 'K',
      contexts: [],
      slot_definitions: [],
      utterances: ['k', 'K'].map(makeTestUtterance) // no ml
    }
  ]
  await oosIntentClassifier.train(makeTrainset(intentsDefs), dummyProgress)
  const model = oosIntentClassifier.serialize()
  oosIntentClassifier = new OOSIntentClassifier(fakeTools)
  await oosIntentClassifier.load(model)

  // act
  const pred = await oosIntentClassifier.predict(makeTestUtterance('k'))

  // assert
  const [k, none] = _.orderBy(pred.intents, i => i.name)
  expect(k.confidence).toBe(1)
  expect(none.confidence).toBeLessThan(1)
})
