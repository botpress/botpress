import _ from 'lodash'
import { makeTestUtterance } from '../test-utils/fake-utterance'

import { Intent } from '../typings'
import Utterance from '../utterance/utterance'

import { ExactIntenClassifier } from './exact-intent-classifier'
import { ModelLoadingError } from '../../errors'

const u1 = 'Hi my name is Alex W and I try to make NLU for a living'
const u2 = "Hi I'm Justine and I'm a smart bot with very scoped skills"
const u3 = 'Medication makes me high'

const intent1: Intent<Utterance> = {
  name: 'intent1',
  contexts: ['global'],
  slot_definitions: [],
  utterances: [u1, u2].map(makeTestUtterance)
}

const intent2: Intent<Utterance> = {
  name: 'intent2',
  contexts: ['global', 'marijane'],
  slot_definitions: [],
  utterances: [makeTestUtterance(u3)]
}

const intents = [intent1, intent2]

const dummyProgress = () => {}

const isOneHot = (x: number[]) => {
  const N = x.length
  return x.filter(xi => xi === 1).length === 1 && x.filter(xi => xi === 0).length === N - 1
}

describe('Exact match intent classifier', () => {
  test('when no match clf returns all confidence 0 and oos 1', async () => {
    let exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.train(
      {
        intents,
        languageCode: 'en',
        list_entities: [],
        pattern_entities: [],
        nluSeed: 42
      },
      dummyProgress
    )

    const model = exactMatchIntentClf.serialize()
    exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.load(model)

    const preds = await exactMatchIntentClf.predict(makeTestUtterance('Some random string'))

    expect(preds.oos).toBe(1)
    expect(preds.intents.some(i => i.confidence > 0)).toBe(false)
  })

  test('when match clf returns one hot vector', async () => {
    let exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.train(
      {
        intents,
        languageCode: 'en',
        list_entities: [],
        pattern_entities: [],
        nluSeed: 42
      },
      dummyProgress
    )

    const model = exactMatchIntentClf.serialize()
    exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.load(model)

    const pairs: [string, Intent<Utterance>][] = [
      [u1, intent1],
      [u2, intent1],
      [u3, intent2]
    ]

    for (const [u, i] of pairs) {
      const preds = await exactMatchIntentClf.predict(makeTestUtterance(u))

      expect(preds.oos).toBe(0)
      const confs = preds.intents.map(i => i.confidence)
      expect(isOneHot(confs)).toBe(true)
    }
  })

  // This test is dependant of utterance.toString() implementation. Ideally we would mock the utterance class.
  test('clf matches even when casing or special characters', async () => {
    let exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.train(
      {
        intents,
        languageCode: 'en',
        list_entities: [],
        pattern_entities: [],
        nluSeed: 42
      },
      dummyProgress
    )

    const model = exactMatchIntentClf.serialize()
    exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.load(model)

    const u1_hat = 'hi mY nAMe is Alex W and I try to maKe nLu for a living' // case insensitive
    const u2_hat = 'Hi I_m Justine and I_m a smart bot with very scoped skills' // ignore special characters
    const u3_hat = 'Medication makes me high ¿÷≥≤µ˜∫√≈æ' // ignore special characters

    const pairs: [string, Intent<Utterance>][] = [
      [u1_hat, intent1],
      [u2_hat, intent1],
      [u3_hat, intent2]
    ]

    for (const [u, i] of pairs) {
      const preds = await exactMatchIntentClf.predict(makeTestUtterance(u))

      expect(preds.oos).toBe(0)
      const confs = preds.intents.map(i => i.confidence)
      expect(isOneHot(confs)).toBe(true)
    }
  })

  test('When model is corrupted, loading a model throws', async () => {
    // arrange
    const exactMatchIntentClf = new ExactIntenClassifier()
    await exactMatchIntentClf.train(
      {
        intents,
        languageCode: 'en',
        list_entities: [],
        pattern_entities: [],
        nluSeed: 42
      },
      dummyProgress
    )
    const model = exactMatchIntentClf.serialize()

    // act && asert
    await expect(exactMatchIntentClf.load(`${model} heyhey I will kill this model`)).rejects.toThrowError(
      ModelLoadingError
    )

    const parsed = JSON.parse(model)
    parsed['someKey'] = 'someValue'
    await expect(exactMatchIntentClf.load(JSON.stringify(parsed))).rejects.toThrowError(ModelLoadingError)

    const undef: unknown = undefined
    await expect(exactMatchIntentClf.load(undef as string)).rejects.toThrowError(ModelLoadingError)
  })
})
