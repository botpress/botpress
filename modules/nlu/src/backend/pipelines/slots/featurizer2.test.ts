import { SPACE } from '../../tools/token-utils'
import { Sequence, Token } from '../../typings'

import * as featurizer from './featurizer2'

const AN_INTENT = 'Give-me Money!'
const SOME_TOKENS = [
  {
    value: `${SPACE}I`,
    cannonical: 'I',
    matchedEntities: []
  },
  {
    value: `${SPACE}need`,
    cannonical: 'need',
    matchedEntities: []
  },
  {
    value: `${SPACE}five`,
    cannonical: 'five',
    matchedEntities: ['number']
  },
  {
    value: `${SPACE}bucks`,
    cannonical: 'bucks',
    matchedEntities: ['animal', 'money']
  }
] as Token[]

const A_SEQUENCE = {
  tokens: SOME_TOKENS,
  intent: AN_INTENT
} as Sequence

describe('CRF Featurizer 2', () => {
  test('featToCRFsuiteAttr', () => {
    const feats = [
      {
        name: 'feat',
        value: 1
      },
      {
        name: 'feat0',
        value: false,
        boost: 1000
      }
    ] as featurizer.CRFFeature[]

    expect(featurizer.featToCRFsuiteAttr('pref', feats[0])).toEqual('preffeat=1:1')
    expect(featurizer.featToCRFsuiteAttr('else', feats[1])).toEqual('elsefeat0=false:1000')
  })

  test('getFeaturesPairs', () => {
    const features = [
      { name: 'name', value: 2 },
      { name: 'otherfeat', value: false, boost: 5 },
      { name: 'diff', value: 'nothing' }
    ] as featurizer.CRFFeature[]
    const features1 = [
      { name: 'name', value: 3 },
      { name: 'otherfeat', value: true, boost: 2 },
      { name: 'feat', value: 'nothing' }
    ] as featurizer.CRFFeature[]

    const featPairs = featurizer.getFeatPairs(features, features1, ['name', 'otherfeat', 'feat', 'wrongFeat'])

    expect(featPairs.length).toEqual(3)

    expect(featPairs[0].name).toEqual('name')
    expect(featPairs[0].value).toEqual('2|3')
    expect(featPairs[0].boost).toEqual(1)

    expect(featPairs[1].name).toEqual('otherfeat')
    expect(featPairs[1].value).toEqual('false|true')
    expect(featPairs[1].boost).toEqual(5)

    expect(featPairs[2].name).toEqual('feat')
    expect(featPairs[2].value).toEqual('null|nothing')
    expect(featPairs[2].boost).toEqual(1)
  })

  test('getWordWeight', () => {
    const token = { value: 'a token' } as UtteranceToken

    expect(featurizer.getWordWeight({ ...token, tfidf: 0 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 0.1 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 0.5 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 0.51 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 0.99 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1 }).value).toEqual('low')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1.1 }).value).toEqual('medium')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1.49 }).value).toEqual('medium')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1.5 }).value).toEqual('medium')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1.51 }).value).toEqual('high')
    expect(featurizer.getWordWeight({ ...token, tfidf: 1.99 }).value).toEqual('high')
    expect(featurizer.getWordWeight({ ...token, tfidf: 2 }).value).toEqual('high')
    expect(featurizer.getWordWeight({ ...token, tfidf: 2.1 }).value).toEqual('high')
    expect(featurizer.getWordWeight({ ...token, tfidf: 10 }).value).toEqual('high')
  })

  test('getClusterFeat', async () => {
    const a_wordvec: ReadonlyArray<number> = [0, 1, 2]
    const cluster = 4
    const token = {
      value: 'atok',
      vectors: a_wordvec
    } as UtteranceToken

    const mockedKmeans = { nearest: jest.fn(() => [cluster]) }

    const feat = await featurizer.getClusterFeat(token, mockedKmeans)

    expect(mockedKmeans.nearest.mock.calls[0][0]).toEqual([a_wordvec])
    expect(feat.name).toEqual('cluster')
    expect(feat.value).toEqual(cluster)
  })

  test('getWordFeat', () => {
    const tokens = [
      { value: 'i', isWord: true, entities: ['hello'] },
      { value: 'i', isWord: true, entities: [] },
      { value: SPACE, isWord: false, entities: ['hello'] },
      { value: SPACE, isWord: false, entities: [] }
    ]

    for (const tok of tokens) {
      Object.defineProperty(tok, 'toString', { value: jest.fn().mockReturnValue(tok.value) })
    }

    const feat = featurizer.getWordFeat(tokens[0], true)
    const feat1 = featurizer.getWordFeat(tokens[0], false)
    const feat2 = featurizer.getWordFeat(tokens[1], true)
    const feat3 = featurizer.getWordFeat(tokens[1], false)
    const feat4 = featurizer.getWordFeat(tokens[2], true)
    const feat5 = featurizer.getWordFeat(tokens[2], false)
    const feat6 = featurizer.getWordFeat(tokens[3], true)
    const feat7 = featurizer.getWordFeat(tokens[3], false)

    expect(feat).toBeUndefined()
    expect(feat1).toBeUndefined()
    expect(tokens[0].toString).not.toBeCalled()

    expect(feat2.value).toEqual('i')
    expect(feat2.boost).toEqual(3)
    expect(feat3.value).toEqual('i')
    expect(feat3.boost).toEqual(1)
    expect(tokens[1].toString).toBeCalled()

    expect(feat4).toBeUndefined()
    expect(feat5).toBeUndefined()
    expect(tokens[2].toString).not.toBeCalled()

    expect(feat6).toBeUndefined()
    expect(feat7).toBeUndefined()
    expect(tokens[3].toString).not.toBeCalled()
  })

  test('getInVocabFeat', () => {
    const token = { value: 'fly' } as UtteranceToken
    const anotherToken = { value: 'paul' } as UtteranceToken
    const anIntent = {
      name: 'find flight',
      vocab: {
        fly: true
      }
    }

    expect(featurizer.getInVocabFeat({ ...token, slots: ['slot0'] }, anIntent).value).toBeFalsy()
    expect(featurizer.getInVocabFeat({ ...token }, anIntent).value).toBeTruthy()
    expect(featurizer.getInVocabFeat({ ...anotherToken }, anIntent).value).toBeFalsy()
  })

  test('getEntitiesFeats', () => {
    const allowedEntities = ['person', 'number', 'fruit']
    const token = { entities: [{ type: 'person' }] }
    const token1 = { entities: ['animal'] }
    const token2 = { entities: [] }
    const token3 = { entities: [{ type: 'fruit' }, { type: 'person' }] }

    const feats0 = featurizer.getEntitiesFeats(token, allowedEntities, true)
    const feats1 = featurizer.getEntitiesFeats(token, allowedEntities, false)
    const feats2 = featurizer.getEntitiesFeats(token, [], false)
    const feats3 = featurizer.getEntitiesFeats(token1, allowedEntities, false)
    const feats4 = featurizer.getEntitiesFeats(token2, allowedEntities, false)
    const feats5 = featurizer.getEntitiesFeats(token3, allowedEntities, false)

    expect(feats0.length).toEqual(1)
    expect(feats0[0].value).toEqual('person')
    expect(feats0[0].boost).toEqual(3)
    expect(feats1.length).toEqual(1)
    expect(feats1[0].value).toEqual('person')
    expect(feats1[0].boost).toEqual(1)
    expect(feats2.length).toEqual(1)
    expect(feats2[0].value).toEqual('none')
    expect(feats2[0].boost).toEqual(1)
    expect(feats3.length).toEqual(1)
    expect(feats3[0].value).toEqual('none')
    expect(feats3[0].boost).toEqual(1)
    expect(feats4.length).toEqual(1)
    expect(feats4[0].value).toEqual('none')
    expect(feats4[0].boost).toEqual(1)
    expect(feats5.length).toEqual(2)
    expect(feats5[0].value).toEqual('fruit')
    expect(feats5[0].boost).toEqual(1)
    expect(feats5[1].value).toEqual('person')
    expect(feats5[1].boost).toEqual(1)
  })

  test('getIntentFeature', () => {
    const anIntent = {
      name: 'give-me-money'
    }
    const feat = featurizer.getIntentFeature(anIntent)

    expect(feat.value).toEqual(anIntent.name)
    expect(feat.boost).toEqual(100)
  })

  test('getTokenQuartile', () => {
    const anUtterance = {
      tokens: ['a', 'b', 'c', 'd']
    }
    // here
    expect(featurizer.getTokenQuartile(anUtterance, { index: 0 }).value).toEqual(1)
    expect(featurizer.getTokenQuartile(anUtterance, { index: 1 }).value).toEqual(2)
    expect(featurizer.getTokenQuartile(anUtterance, { index: 2 }).value).toEqual(3)
    expect(featurizer.getTokenQuartile(anUtterance, { index: 3 }).value).toEqual(4)
  })
})
