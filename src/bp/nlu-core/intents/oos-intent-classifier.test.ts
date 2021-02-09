import _ from 'lodash'
import { makeFakeTools } from 'nlu-core/test-utils/fake-tools'
import { makeTestUtterance } from 'nlu-core/test-utils/fake-utterance'

import { OOSIntentClassifier } from './oos-intent-classfier'

const languageDimension = 10
const languages = ['en']
const fakeTools = makeFakeTools(languageDimension, languages)
const dummyProgress = (p: number) => {}

const [u1, u2, u3, u4, u5, u6, u7, u8, u9] = [
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

test('predict with exact match returns confidence 1 for exact-match', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  await oosIntentClassifier.train(
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
          utterances: [u1, u3, u5]
        },
        {
          name: 'B',
          contexts: [],
          slot_definitions: [],
          utterances: [u2, u6, u7, u8, u9]
        }
      ],
      allUtterances: [u1, u2, u3, u4, u5, u6, u7, u8, u9]
    },
    dummyProgress
  )

  // act
  const { intents } = await oosIntentClassifier.predict(u1)

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents[0]).toEqual({ name: 'A', confidence: 1, extractor: 'exact-matcher' })
})

test('predict with no exact match returns confidence that sums up to 1', async () => {
  // arrange
  const oosIntentClassifier = new OOSIntentClassifier(fakeTools)

  await oosIntentClassifier.train(
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
          utterances: [u1, u3, u5]
        },
        {
          name: 'B',
          contexts: [],
          slot_definitions: [],
          utterances: [u2, u6, u7, u8, u9]
        }
      ],
      allUtterances: [u1, u2, u3, u4, u5, u6, u7]
    },
    dummyProgress
  )

  // act
  const { intents } = await oosIntentClassifier.predict(
    makeTestUtterance('you better check yourself before you wreck yourself')
  )

  // assert
  expect(intents.map(i => i.name).sort()).toEqual(['A', 'B', 'none'])
  expect(intents.map(i => i.extractor)).toEqual(['svm-classifier', 'svm-classifier', 'svm-classifier'])
  expect(intents.map(i => i.confidence).some(c => c === 1)).toEqual(false)
})
