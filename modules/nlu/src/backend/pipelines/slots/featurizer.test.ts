import { SPACE } from '../../tools/token-utils'
import { Sequence, Token } from '../../typings'
import { getClosestToken } from '../language/ft_featurizer'
jest.mock('../language/ft_featurizer', () => ({ getClosestToken: jest.fn() }))

import {
  CRFFeature,
  featToCRFsuiteAttr,
  getClusterFeat,
  getEntitiesFeats,
  getFeatPairs,
  getIntentFeature,
  getInVocabFeat,
  getTokenQuartile,
  getWordFeat,
  getWordWeight
} from './featurizer'

const AN_INTENT = 'Give-me Money!'
const SOME_TOKENS = [
  {
    value: `${SPACE}I`,
    canonical: 'I',
    matchedEntities: []
  },
  {
    value: `${SPACE}need`,
    canonical: 'need',
    matchedEntities: []
  },
  {
    value: `${SPACE}five`,
    canonical: 'five',
    matchedEntities: ['number']
  },
  {
    value: `${SPACE}bucks`,
    canonical: 'bucks',
    matchedEntities: ['animal', 'money']
  }
] as Token[]

const A_SEQUENCE = {
  tokens: SOME_TOKENS,
  intent: AN_INTENT
} as Sequence

describe('CRF Featurizer', () => {
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
    ] as CRFFeature[]

    expect(featToCRFsuiteAttr('pref', feats[0])).toEqual('preffeat=1:1')
    expect(featToCRFsuiteAttr('else', feats[1])).toEqual('elsefeat0=false:1000')
  })

  test('getFeaturesPairs', () => {
    const features = [
      { name: 'name', value: 2 },
      { name: 'otherfeat', value: false, boost: 5 },
      { name: 'diff', value: 'nothing' }
    ] as CRFFeature[]
    const features1 = [
      { name: 'name', value: 3 },
      { name: 'otherfeat', value: true, boost: 2 },
      { name: 'feat', value: 'nothing' }
    ] as CRFFeature[]

    const featPairs = getFeatPairs(features, features1, ['name', 'otherfeat', 'feat', 'wrongFeat'])

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

  test('getWordWeight', async () => {
    const closest_token = 'something'
    const closest_token1 = 'something1'
    const closest_token2 = 'something2'
    const a_wordvec = [0.23, 0.123, 0.543, 1.123, 3.45]
    const token2Vec = {}
    const tfidf = {
      global: {
        [SOME_TOKENS[0].canonical.toLowerCase()]: 0.5,
        [closest_token]: 0.5,
        [closest_token1]: 1.2,
        [closest_token2]: 1.7
      }
    }

    const mockedLanguageProvider = { vectorize: jest.fn(() => Promise.resolve([a_wordvec])) }
    getClosestToken.mockReturnValueOnce(Promise.resolve(closest_token))
    getClosestToken.mockReturnValueOnce(Promise.resolve(closest_token1))
    getClosestToken.mockReturnValueOnce(Promise.resolve(closest_token2))

    const feat = await getWordWeight(SOME_TOKENS[0], tfidf, mockedLanguageProvider, token2Vec, 'en')
    const feat1 = await getWordWeight(SOME_TOKENS[3], tfidf, mockedLanguageProvider, token2Vec, 'en')
    const feat2 = await getWordWeight(SOME_TOKENS[3], tfidf, mockedLanguageProvider, token2Vec, 'en')
    const feat3 = await getWordWeight(SOME_TOKENS[3], tfidf, mockedLanguageProvider, token2Vec, 'en')

    expect(feat.value).toEqual('low')
    expect(feat1.value).toEqual('low')
    expect(feat2.value).toEqual('medium')
    expect(feat3.value).toEqual('high')

    expect(getClosestToken).toHaveBeenCalledTimes(3)
    expect(getClosestToken.mock.calls[0][0]).toEqual(SOME_TOKENS[3].canonical.toLowerCase())
  })

  test('getClusterFeat', async () => {
    const a_wordvec = [0, 1, 2]
    const cluster = 4
    const mockedKmeans = { nearest: jest.fn(() => [cluster]) }
    const lang = 'en'

    const mockedLanguageProvider = { vectorize: jest.fn(() => Promise.resolve([a_wordvec])) }

    const feat = await getClusterFeat(SOME_TOKENS[0], mockedLanguageProvider, mockedKmeans, lang)

    expect(mockedLanguageProvider.vectorize.mock.calls[0][0]).toEqual([SOME_TOKENS[0].canonical.toLowerCase()])
    expect(mockedLanguageProvider.vectorize.mock.calls[0][1]).toEqual(lang)
    expect(mockedKmeans.nearest.mock.calls[0][0]).toEqual([a_wordvec])
    expect(feat.name).toEqual('cluster')
    expect(feat.value).toEqual(cluster)
  })

  test('getWordFeat', () => {
    const feat = getWordFeat(SOME_TOKENS[0], false)
    const feat1 = getWordFeat(SOME_TOKENS[1], true)

    expect(feat.value).toEqual('i')
    expect(feat.boost).toEqual(1)
    expect(feat1.value).toEqual('need')
    expect(feat1.boost).toEqual(3)
  })

  test('getInVocabFeat', () => {
    const anotherIntent = 'find flight'
    const vocab = {
      i: [AN_INTENT, anotherIntent],
      need: [AN_INTENT, anotherIntent],
      five: [AN_INTENT],
      bucks: [AN_INTENT]
    }
    const tok = {
      canonical: 'fly'
    } as Token

    const feat0 = getInVocabFeat(tok, vocab, AN_INTENT)
    const feat1 = getInVocabFeat(tok, vocab, anotherIntent)
    const feat2 = getInVocabFeat(SOME_TOKENS[0], vocab, AN_INTENT)
    const feat3 = getInVocabFeat(SOME_TOKENS[0], vocab, anotherIntent)
    const feat4 = getInVocabFeat(SOME_TOKENS[3], vocab, AN_INTENT)
    const feat5 = getInVocabFeat(SOME_TOKENS[3], vocab, anotherIntent)

    expect(feat0.value).toEqual(false)
    expect(feat1.value).toEqual(false)
    expect(feat2.value).toEqual(true)
    expect(feat3.value).toEqual(true)
    expect(feat4.value).toEqual(true)
    expect(feat5.value).toEqual(false)
  })

  test('getEntitiesFeats', () => {
    const allowedEntities = ['animal']
    const feats0 = getEntitiesFeats(SOME_TOKENS[0], allowedEntities, true)
    const feats1 = getEntitiesFeats(SOME_TOKENS[1], allowedEntities, false)
    const feats2 = getEntitiesFeats(SOME_TOKENS[2], allowedEntities, false)
    const feats3 = getEntitiesFeats(SOME_TOKENS[3], allowedEntities, false)

    expect(feats0.length).toEqual(1)
    expect(feats0[0].value).toEqual('none')
    expect(feats0[0].boost).toEqual(3)
    expect(feats1.length).toEqual(1)
    expect(feats1[0].value).toEqual('none')
    expect(feats1[0].boost).toEqual(1)
    expect(feats2.length).toEqual(1)
    expect(feats2[0].value).toEqual('none')
    expect(feats2[0].boost).toEqual(1)
    expect(feats3.length).toEqual(1)
    expect(feats3[0].value).toEqual('animal')
    expect(feats3[0].boost).toEqual(1)
  })

  test('getIntentFeature', () => {
    const res = getIntentFeature(A_SEQUENCE.intent)
    expect(res.value).toEqual('give-memoney')
  })

  test('getTokenQuartile', () => {
    const res0 = getTokenQuartile(A_SEQUENCE, 0)
    const res1 = getTokenQuartile(A_SEQUENCE, 1)
    const res2 = getTokenQuartile(A_SEQUENCE, 2)
    const res3 = getTokenQuartile(A_SEQUENCE, 3)

    expect(res0.value).toEqual(1)
    expect(res1.value).toEqual(2)
    expect(res2.value).toEqual(3)
    expect(res3.value).toEqual(4)
  })
})
