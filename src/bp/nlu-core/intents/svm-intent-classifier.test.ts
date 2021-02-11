import _ from 'lodash'
import { makeFakeTools } from 'nlu-core/test-utils/fake-tools'
import { makeTestUtterance } from 'nlu-core/test-utils/fake-utterance'
import Utterance from 'nlu-core/utterance/utterance'

import { SvmIntentClassifier } from './svm-intent-classifier'

const languageDimension = 10
const languages = ['en']
const fakeTools = makeFakeTools(languageDimension, languages)
const fakeFeaturizer = (utt: Utterance) => [..._.range(languageDimension)]
const dummyProgress = (p: number) => {}

test('predict with no data points returns empty array', async () => {
  // arrange
  const rootIntentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await rootIntentClassifier.train(
    {
      languageCode: 'en',
      list_entities: [],
      pattern_entities: [],
      nluSeed: 42,
      intents: []
    },
    dummyProgress
  )

  // act
  const { intents } = await rootIntentClassifier.predict(
    makeTestUtterance("hello, I love you won't you tell me your name")
  )

  // assert
  expect(intents.length).toEqual(0)
})

test('predict with only one class returns the only class with confidence 1', async () => {
  // arrange
  const rootIntentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await rootIntentClassifier.train(
    {
      languageCode: 'en',
      list_entities: [],
      pattern_entities: [],
      nluSeed: 42,
      intents: [
        {
          name: 'A',
          contexts: [],
          slot_definitions: [],
          utterances: [makeTestUtterance('You Cannot Petition The Lord With Prayer')]
        }
      ]
    },
    dummyProgress
  )

  // act
  const { intents } = await rootIntentClassifier.predict(
    makeTestUtterance("hello, I love you won't you tell me your name")
  )

  // assert
  const labels = intents.map(i => i.name)
  const confs = intents.map(i => i.confidence)
  expect(labels).toEqual(['A'])
  expect(confs).toEqual([1])
})

test('predict with multiple class returns svm prediction', async () => {
  // arrange
  const rootIntentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await rootIntentClassifier.train(
    {
      languageCode: 'en',
      list_entities: [],
      pattern_entities: [],
      nluSeed: 42,
      intents: [
        {
          name: 'A',
          contexts: [],
          slot_definitions: [],
          utterances: [makeTestUtterance('You Cannot Petition The Lord With Prayer')]
        },
        {
          name: 'B',
          contexts: [],
          slot_definitions: [],
          utterances: [makeTestUtterance('You Can Petition The Lord With Prayer')]
        },
        {
          name: 'C',
          contexts: [],
          slot_definitions: [],
          utterances: [makeTestUtterance('You might not want to Petition The Lord With Prayer')]
        }
      ]
    },
    dummyProgress
  )

  // act
  const { intents } = await rootIntentClassifier.predict(
    makeTestUtterance("hello, I love you won't you tell me your name")
  )

  // assert
  const labels = intents.map(i => i.name)
  const confs = intents.map(i => i.confidence)
  expect(labels.sort()).toEqual(['A', 'B', 'C'])

  const totalConf = confs.reduce((sum, x) => sum + x, 0)
  expect(totalConf).toEqual(1)
})
