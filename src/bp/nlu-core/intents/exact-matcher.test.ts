import { SPECIAL_CHARSET } from '../tools/chars'
import { Intent } from '../typings'
import Utterance, { makeTestUtterance } from '../utterance/utterance'

import { BuildExactMatchIndex } from './exact-matcher'

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
  const intents = [intent1, intent2, noneIntent]

  const exactMatchIndex = BuildExactMatchIndex(intents)
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
      expect(exactMatchIndex[k2].intent).toEqual(intent1.name)
      expect(exactMatchIndex[k3].intent).toEqual(intent2.name)
    })
  })
})
