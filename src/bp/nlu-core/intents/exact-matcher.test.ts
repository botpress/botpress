import { findExactIntentForCtx } from '../predict-pipeline'
import { SPECIAL_CHARSET } from '../tools/chars'
import { BuildExactMatchIndex, TrainStep } from '../training-pipeline'
import { Intent } from '../typings'
import Utterance, { makeTestUtterance } from '../utterance/utterance'

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

const noneIntent: Intent<Utterance> = {
  name: 'none',
  contexts: ['global'],
  slot_definitions: [],
  utterances: [makeTestUtterance('lorem ipsum dolor sit amet')]
}

describe('Exact match', () => {
  const input = {
    intents: [intent1, intent2, noneIntent]
  } as TrainStep

  const exactMatchIndex = BuildExactMatchIndex(input)
  describe('Build exact match index', () => {
    test('none intent not added', () => {
      Object.values(exactMatchIndex).forEach(entry => {
        expect(entry.intent).not.toEqual('none')
      })
    })

    test('index contains proper keys', () => {
      const keys = [u1, u2, u3].map(u =>
        u.replace(new RegExp(`(${SPECIAL_CHARSET.join('|')}|\\s)`, 'gi'), '').toLowerCase()
      )
      expect(Object.keys(exactMatchIndex)).toEqual(keys)
    })

    test('index content', () => {
      const [k1, k2, k3] = [u1, u2, u3].map(u =>
        u.replace(new RegExp(`(${SPECIAL_CHARSET.join('|')}|\\s)`, 'gi'), '').toLowerCase()
      )
      expect(exactMatchIndex[k1].intent).toEqual(intent1.name)
      expect(exactMatchIndex[k1].contexts).toEqual(intent1.contexts)
      expect(exactMatchIndex[k2].intent).toEqual(intent1.name)
      expect(exactMatchIndex[k2].contexts).toEqual(intent1.contexts)
      expect(exactMatchIndex[k3].intent).toEqual(intent2.name)
      expect(exactMatchIndex[k3].contexts).toEqual(intent2.contexts)
    })
  })

  test('find exact match', () => {
    const [utt1, utt2, utt3] = [u1, u3, 'This is just a test'].map(makeTestUtterance)
    const pred1 = findExactIntentForCtx(exactMatchIndex, utt1, 'marijane')
    const pred2 = findExactIntentForCtx(exactMatchIndex, utt1, 'global')
    const pred3 = findExactIntentForCtx(exactMatchIndex, utt2, 'marijane')
    const pred4 = findExactIntentForCtx(exactMatchIndex, utt2, 'global')
    const pred5 = findExactIntentForCtx(exactMatchIndex, utt3, 'marijane')
    const pred6 = findExactIntentForCtx(exactMatchIndex, utt3, 'global')

    expect(pred1).toBeUndefined()
    expect(pred2!.label).toEqual(intent1.name)
    expect(pred2!.confidence).toEqual(1)
    expect(pred3!.label).toEqual(intent2.name)
    expect(pred3!.confidence).toEqual(1)
    expect(pred4!.label).toEqual(intent2.name)
    expect(pred4!.confidence).toEqual(1)
    expect(pred5).toBeUndefined()
    expect(pred6).toBeUndefined()
  })
})
