import _ from 'lodash'
import { makeFakeTools } from '../test-utils/fake-tools'
import { makeTestUtterance } from '../test-utils/fake-utterance'
import Utterance from '../utterance/utterance'

import { SvmIntentClassifier } from './svm-intent-classifier'
import { Intent } from '../typings'
import { ModelLoadingError } from '../../errors'

const languageDimension = 10
const languages = ['en']
const fakeTools = makeFakeTools(languageDimension, languages)
const fakeFeaturizer = (utt: Utterance) => [..._.range(languageDimension)]
const dummyProgress = (p: number) => {}

const emptyDataset = {
  languageCode: 'en',
  list_entities: [],
  pattern_entities: [],
  nluSeed: 42,
  intents: []
}

const intentA: Intent<Utterance> = {
  name: 'A',
  contexts: [],
  slot_definitions: [],
  utterances: [makeTestUtterance('You Cannot Petition The Lord With Prayer')]
}
const intentB: Intent<Utterance> = {
  name: 'B',
  contexts: [],
  slot_definitions: [],
  utterances: [makeTestUtterance('You Can Petition The Lord With Prayer')]
}
const intentC: Intent<Utterance> = {
  name: 'C',
  contexts: [],
  slot_definitions: [],
  utterances: [makeTestUtterance('You might not want to Petition The Lord With Prayer')]
}

const makeTrainset = (intents: Intent<Utterance>[]) => {
  return { ...emptyDataset, intents }
}

const helloILoveYou = makeTestUtterance("hello, I love you won't you tell me your name")

test('predict with no data points returns empty array', async () => {
  // arrange
  let intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.train(emptyDataset, dummyProgress)

  const model = intentClassifier.serialize()
  intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.load(model)

  // act
  const { intents } = await intentClassifier.predict(helloILoveYou)

  // assert
  expect(intents.length).toEqual(0)
})

test('predict with only one class returns the only class with confidence 1', async () => {
  // arrange
  let intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.train(makeTrainset([intentA]), dummyProgress)

  const model = intentClassifier.serialize()
  intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.load(model)

  // act
  const { intents } = await intentClassifier.predict(helloILoveYou)

  // assert
  const labels = intents.map(i => i.name)
  const confs = intents.map(i => i.confidence)
  expect(labels).toEqual(['A'])
  expect(confs).toEqual([1])
})

test('predict with multiple class returns svm prediction', async () => {
  // arrange
  let intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.train(makeTrainset([intentA, intentB, intentC]), dummyProgress)

  const model = intentClassifier.serialize()
  intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.load(model)

  // act
  const { intents } = await intentClassifier.predict(helloILoveYou)

  // assert
  const labels = intents.map(i => i.name)
  const confs = intents.map(i => i.confidence)
  expect(labels.sort()).toEqual(['A', 'B', 'C'])

  const totalConf = confs.reduce((sum, x) => sum + x, 0)
  expect(totalConf).toEqual(1)
})

test('When model is corrupted, loading a model throws', async () => {
  // arrange
  const intentClassifier = new SvmIntentClassifier(fakeTools, fakeFeaturizer)
  await intentClassifier.train(makeTrainset([intentA, intentB, intentC]), dummyProgress)
  const model = intentClassifier.serialize()

  // act && asert
  await expect(intentClassifier.load(`${model} I'm about to end this model's whole career`)).rejects.toThrowError(
    ModelLoadingError
  )

  const parsed = JSON.parse(model)
  parsed['someKey'] = 'someValue'
  await expect(intentClassifier.load(JSON.stringify(parsed))).rejects.toThrowError(ModelLoadingError)

  const undef: unknown = undefined
  await expect(intentClassifier.load(undef as string)).rejects.toThrowError(ModelLoadingError)
})
