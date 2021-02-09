import _ from 'lodash'
import { makeFakeTools } from 'nlu-core/test-utils/fake-tools'
import { makeTestUtterance } from 'nlu-core/test-utils/fake-utterance'
import { Intent } from 'nlu-core/typings'
import Utterance from 'nlu-core/utterance/utterance'

import { OOSIntentClassifier } from './oos-intent-classfier'

const languageDimension = 10
const languages = ['en']
const fakeTools = makeFakeTools(languageDimension, languages)
const dummyProgress = (p: number) => {}

const allUtterances = [
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

  // act
  const { intents } = await oosIntentClassifier.predict(u1)

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents[0]).toEqual({ name: 'A', confidence: 1, extractor: 'exact-matcher' })
})

test('predict with no exact match returns confidence that sums up to 1', async () => {
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

  // act
  const { intents } = await oosIntentClassifier.predict(
    makeTestUtterance('you better check yourself before you wreck yourself')
  )

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents.map(i => i.extractor)).toEqual(['svm-classifier', 'svm-classifier', 'svm-classifier'])
  expect(intents.map(i => i.confidence).some(c => c === 1)).toEqual(false)
})

test('predict with less than min utterances for ml should not match', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

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

  // act
  const { intents } = await oosIntentClassifier.predict(
    makeTestUtterance('you better check yourself before you wreck yourself')
  )

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['none'])
  expect(intents.map(i => i.extractor)).toEqual(['svm-classifier'])
  expect(intents.map(i => i.confidence)).toEqual([1])
})

test('predict with available oos should give oos prediction', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

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

  // act
  const { oos } = await oosIntentClassifier.predict(
    makeTestUtterance('you better check yourself before you wreck yourself')
  )

  // assert
  expect(oos).toBeGreaterThan(0)
})

test('predict with unavailable oos should return oos 0', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

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

  // act
  const predictUtt = makeTestUtterance('you better check yourself before you wreck yourself')
  predictUtt.languageCode = 'xyz'
  const { oos } = await oosIntentClassifier.predict(predictUtt)

  // assert
  expect(oos).toBe(0)
})
