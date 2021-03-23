import { MLToolkit } from 'botpress/sdk'
import _ from 'lodash'
import { tokenizeLatinTextForTests } from '../test-utils/fake-tools'

import { POSClass } from '../language/pos-tagger'
import { SPACE } from '../tools/token-utils'
import { EntityExtractor, ExtractedEntity, ExtractedSlot } from '../typings'

import Utterance, { preprocessRawUtterance, UtteranceToStringOptions } from './utterance'

const METADATA = {
  source: '',
  entityId: '',
  extractor: <EntityExtractor>'system'
}
const TOKENS = tokenizeLatinTextForTests('You might want to behave like if you are not like one of us , But you are !') // split punct by space to simplify tokenization
const VECTORS = TOKENS.map(() => Array.from({ length: 5 }, () => _.random(0, 1, true)))
const POS_TAGS = [
  'PRON',
  'VERB',
  'VERB',
  'PART',
  'VERB',
  'SCONJ',
  'SCONJ',
  'PRON',
  'AUX',
  'PART',
  'SCONJ',
  'NUM',
  'ADP',
  'PRON',
  'PUNCT',
  'CCONJ',
  'PRON',
  'AUX',
  'PUNCT'
]
  .map(a => [a, '_'])
  .reduce((tags, next) => tags.concat(next))
  .slice(0, -1) as POSClass[]

describe('UtteranceClass', () => {
  describe('tokens', () => {
    test('Array is readonly', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      // @ts-ignore
      expect(() => (utterance.tokens = [])).toThrow()
    })

    test('Token object is readonly', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      // @ts-ignore
      expect(() => (utterance.tokens[0].index = 25)).toThrow()
    })

    test('tokens, vectors & tags are properly associated', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      utterance.tokens.forEach((tok, i) => {
        expect(tok.index).toEqual(i)
        expect(tok.value).toEqual(TOKENS[i])
        expect(tok.vector).toEqual(VECTORS[i])
        expect(tok.POS).toEqual(POS_TAGS[i])
      })
    })

    test('different tokens and vectors length throws', () => {
      expect(() => new Utterance(TOKENS.slice(0, -1), VECTORS, POS_TAGS, 'en')).toThrow()
    })

    test('toString', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')

      expect(utterance.tokens[0].toString()).toEqual('You')
      expect(utterance.tokens[0].toString({ lowerCase: true })).toEqual('you')
      expect(utterance.tokens[1].toString()).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: true })).toEqual(' ')
      expect(utterance.tokens[1].toString({ realSpaces: false })).toEqual(SPACE)
    })

    test('slots', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')

      expect(utterance.tokens[0].slots).toEqual([])
      utterance.tagSlot({ name: 'person', confidence: 0.45, source: 'anything' } as ExtractedSlot, 0, 3)

      expect(utterance.tokens[0].slots.length).toEqual(1)
      expect(utterance.tokens[1].slots.length).toEqual(0)
      expect(utterance.tokens[2].slots.length).toEqual(0)
    })

    test('entities', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      expect(utterance.tokens[0].entities).toEqual([])
      expect(utterance.tokens[3].entities).toEqual([])
      utterance.tagEntity({ type: 'car', confidence: 0.45, value: 'mercedes', metadata: METADATA }, 5, 10)

      expect(utterance.tokens[0].entities.length).toEqual(0)
      expect(utterance.tokens[1].entities.length).toEqual(0)
      expect(utterance.tokens[2].entities.length).toEqual(0)
      expect(utterance.tokens[3].entities.length).toEqual(1)
    })

    test('tfidf', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')

      expect(utterance.tokens[0].tfidf).toEqual(1)
      const tfidf = {
        [TOKENS[0]]: 0.245
      }

      utterance.setGlobalTfidf(tfidf)
      expect(utterance.tokens[0].tfidf).toEqual(0.245)
      expect(utterance.tokens[3].tfidf).toEqual(1)
    })

    test('kmeans', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')

      expect(utterance.tokens[0].cluster).toEqual(1)

      const mockedKmeans = {
        nearest: jest
          .fn()
          .mockReturnValueOnce([4])
          .mockReturnValue([2])
      }

      // @ts-ignore
      utterance.setKmeans(mockedKmeans as MLToolkit.KMeans.KmeansResult)
      expect(utterance.tokens[0].cluster).toEqual(4)
      expect(mockedKmeans.nearest.mock.calls[0][0][0]).toEqual(VECTORS[0])
      expect(utterance.tokens[3].cluster).toEqual(2)
      expect(mockedKmeans.nearest.mock.calls[1][0][0]).toEqual(VECTORS[3])
    })
  })

  describe('slots', () => {
    const slot: Partial<ExtractedSlot> = {
      name: 'person',
      confidence: 1,
      source: 'a source'
    }

    test('tagSlots out of range', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      expect(() => utterance.tagSlot(slot as ExtractedSlot, 500, 800)).toThrow()
      expect(utterance.slots).toEqual([])
    })

    test('tagSlots single token', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      utterance.tagSlot(slot as ExtractedSlot, 0, 3)
      expect(utterance.slots[0].startPos).toEqual(0)
      expect(utterance.slots[0].startTokenIdx).toEqual(0)
      expect(utterance.slots[0].endPos).toEqual(3)
      expect(utterance.slots[0].endTokenIdx).toEqual(0)
    })

    test('tagSlots multiple tokens', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      utterance.tagSlot(slot as ExtractedSlot, 3, 9)

      expect(utterance.slots[0].startPos).toEqual(3)
      expect(utterance.slots[0].startTokenIdx).toEqual(1)
      expect(utterance.slots[0].endPos).toEqual(9)
      expect(utterance.slots[0].endTokenIdx).toEqual(2)
      expect(utterance.tokens[1].slots.length).toEqual(1)
      expect(utterance.tokens[1].slots[0].name).toEqual(slot.name)
      expect(utterance.tokens[1].slots[0].source).toEqual(slot.source)
      expect(utterance.tokens[1].slots[0].confidence).toEqual(slot.confidence)
      expect(utterance.tokens[2].slots.length).toEqual(1)
      expect(utterance.tokens[2].slots[0].name).toEqual(slot.name)
      expect(utterance.tokens[2].slots[0].source).toEqual(slot.source)
      expect(utterance.tokens[2].slots[0].confidence).toEqual(slot.confidence)
      expect(utterance.tokens[3].slots.length).toEqual(0)
    })
  })

  describe('Entities', () => {
    const entity: ExtractedEntity = {
      type: 'number',
      confidence: 1,
      value: 'one',
      metadata: METADATA
    }

    test('tagEntity out of range', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      expect(() => utterance.tagEntity(entity, 500, 1300)).toThrow()
    })

    test('tagEntity single token', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      utterance.tagEntity(entity, 0, 3)
      expect(utterance.entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.entities[0][key]).toEqual(value)
      })
      expect(utterance.entities[0].startPos).toEqual(0)
      expect(utterance.entities[0].startTokenIdx).toEqual(0)
      expect(utterance.entities[0].endPos).toEqual(3)
      expect(utterance.entities[0].endTokenIdx).toEqual(0)
    })

    test('tagEntity multiple tokens', () => {
      const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
      utterance.tagEntity(entity, 3, 9)

      expect(utterance.entities[0].startPos).toEqual(3)
      expect(utterance.entities[0].startTokenIdx).toEqual(1)
      expect(utterance.entities[0].endPos).toEqual(9)
      expect(utterance.entities[0].endTokenIdx).toEqual(2)
      expect(utterance.tokens[1].entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.tokens[1].entities[0][key]).toEqual(value)
      })
      expect(utterance.tokens[2].entities.length).toEqual(1)
      Object.entries(entity).forEach(([key, value]) => {
        expect(utterance.tokens[2].entities[0][key]).toEqual(value)
      })
      expect(utterance.tokens[3].entities.length).toEqual(0)
    })
  })

  describe('clone', () => {
    const utterance = new Utterance(TOKENS, VECTORS, POS_TAGS, 'en')
    const tfidf = TOKENS.reduce((tfidf, tok) => {
      if (!tfidf[tok]) {
        tfidf[tok] = Math.random()
      }
      return tfidf
    }, {})
    utterance.setGlobalTfidf(tfidf)
    utterance.tagSlot({ name: 'slot', confidence: 1, source: 'hey', value: 69 }, 2, 15)
    utterance.tagEntity({ type: 'dist', value: 'entity', confidence: 1, metadata: METADATA }, 22, 28)

    test('clone only', () => {
      const u2 = utterance.clone(false, false)

      expect(u2).not.toBe(utterance)
      expect(u2.slots).toEqual([])
      expect(u2.entities).toEqual([])
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'slots', 'entities', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2![k]))
      })
    })

    test('with entities', () => {
      const u2 = utterance.clone(true, false)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual(utterance.entities)
      expect(u2.slots).toEqual([])
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'slots', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2![k]))
      })
    })

    test('with slots', () => {
      const u2 = utterance.clone(false, true)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual([])
      expect(u2.slots).toEqual(utterance.slots)
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'entities', 'toString')).forEach(([k, v]) => expect(v).toEqual(t2![k]))
      })
    })

    test('with entities and slots', () => {
      const u2 = utterance.clone(true, true)

      expect(u2).not.toBe(utterance)
      expect(u2.entities).toEqual(utterance.entities)
      expect(u2.slots).toEqual(utterance.slots)
      _.zip(utterance.tokens, u2.tokens).forEach(([t1, t2]) => {
        Object.entries(_.omit(t1, 'toString')).forEach(([k, v]) => expect(v).toEqual(t2![k]))
      })
    })
  })

  describe('toString', () => {
    const str = 'This IS a SUPerTest withFire'
    //           0123456789012345678901234567
    const tokens = tokenizeLatinTextForTests(str)
    const fakeVectors = tokens.map(t => [])

    // @ts-ignore
    const fakePOS = tokens.map(t => 'POS') as POSClass[]
    const defaultOptions = {
      entities: 'keep-default',
      slots: 'keep-value',
      onlyWords: false,
      lowerCase: false
    } as UtteranceToStringOptions

    test('format options', () => {
      const u = new Utterance(tokens, fakeVectors, fakePOS, 'en')

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, lowerCase: true })).toEqual(str.toLowerCase())
      expect(u.toString({ ...defaultOptions, onlyWords: true })).toEqual(str.replace(/\s/g, ''))
      expect(u.toString({ ...defaultOptions, onlyWords: true, lowerCase: true })).toEqual(
        str.replace(/\s/g, '').toLowerCase()
      )
    })

    test('slot options', () => {
      const u = new Utterance(tokens, fakeVectors, fakePOS, 'en')
      const slot: Partial<ExtractedSlot> = {
        name: 'Tiger',
        confidence: 1,
        source: 'supertest'
      }
      u.tagSlot(slot as ExtractedSlot, 10, 19)

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'keep-name' })).toEqual(`This IS a ${slot.name} withFire`)
      expect(u.toString({ ...defaultOptions, slots: 'ignore' })).toEqual('This IS a  withFire')
    })

    test('entities options', () => {
      const u = new Utterance(tokens, fakeVectors, fakePOS, 'en')
      const entity: ExtractedEntity = {
        type: 'Woods',
        confidence: 1,
        value: '123',
        metadata: METADATA
      }
      u.tagEntity(entity, 10, 19)

      expect(u.toString(defaultOptions)).toEqual(str)
      expect(u.toString({ ...defaultOptions, entities: 'keep-value' })).toEqual(`This IS a ${entity.value} withFire`)
      expect(u.toString({ ...defaultOptions, entities: 'keep-name' })).toEqual(`This IS a ${entity.type} withFire`)
      expect(u.toString({ ...defaultOptions, entities: 'ignore' })).toEqual('This IS a  withFire')
    })

    test('entities and slots options', () => {
      const u = new Utterance(tokens, fakeVectors, fakePOS, 'en')
      const slot: Partial<ExtractedSlot> = {
        name: 'Tiger',
        confidence: 1,
        source: 'supertest'
      }
      u.tagSlot(slot as ExtractedSlot, 10, 19)
      const entity: ExtractedEntity = {
        type: 'Woods',
        confidence: 1,
        value: '123',
        metadata: METADATA
      }
      u.tagEntity(entity, 10, 19)

      expect(u.toString({ ...defaultOptions, slots: 'keep-value', entities: 'keep-value' })).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'keep-name', entities: 'keep-value' })).toEqual(
        `This IS a ${slot.name} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-default' })).toEqual(str)
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-value' })).toEqual(
        `This IS a ${entity.value} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'keep-name' })).toEqual(
        `This IS a ${entity.type} withFire`
      )
      expect(u.toString({ ...defaultOptions, slots: 'ignore', entities: 'ignore' })).toEqual('This IS a  withFire')
    })
  })

  test('sentence embeddeing', () => {
    const fakePOS = testTokens.map(_ => 'ADJ') as POSClass[]
    const u = new Utterance(testTokens, vecs, fakePOS, 'en')
    u.setGlobalTfidf(globalTFIDF)
    u.sentenceEmbedding().forEach((actual, idx) => {
      expect(actual).toBeCloseTo(expectedEmbeddings[idx], 3)
    })
  })

  test('preprocess raw utterances with horizontal ellipsis', () => {
    const raw = 'That there’s some good in this world, Mr. Frodo… and it’s worth fighting for.'
    const preprocessed = preprocessRawUtterance(raw)

    const expected = 'That there’s some good in this world, Mr. Frodo... and it’s worth fighting for.'
    expect(preprocessed).toBe(expected)
  })
})

// Sentence embedding test data
const testTokens = ['i', 'have', 'an', 'it', 'issue']
const vecs = [
  [
    20.874107360839844,
    13.226028442382812,
    40.754878997802734,
    -32.03583526611328,
    9.544014930725098,
    -18.946258544921875,
    -32.077903747558594,
    25.72711944580078,
    6.000054836273193,
    -9.980449676513672,
    -4.807291030883789,
    34.21776580810547,
    -39.83692169189453,
    -41.74205780029297,
    -32.027469635009766,
    -3.2300822734832764,
    -8.309528350830078,
    17.37891387939453,
    -25.159915924072266,
    -9.755718231201172,
    -21.471263885498047,
    38.0972900390625,
    19.229228973388672,
    -17.59087371826172,
    13.534223556518555
  ],
  [
    -0.24725811183452606,
    -10.69975471496582,
    0.11991189420223236,
    0.15629084408283234,
    9.468283653259277,
    -2.0219221115112305,
    -5.423296928405762,
    7.656525611877441,
    -6.705521583557129,
    1.5514013767242432,
    4.234777927398682,
    3.0641133785247803,
    3.788898229598999,
    -4.689056396484375,
    -2.73398756980896,
    -8.867668151855469,
    7.824917316436768,
    -4.574779510498047,
    -9.939950942993164,
    -6.021678924560547,
    -0.011077036149799824,
    4.60534143447876,
    4.380100250244141,
    0.2817268669605255,
    0.825263500213623
  ],
  [
    6.503832817077637,
    -9.005444526672363,
    -3.8556323051452637,
    2.3468151092529297,
    2.656834602355957,
    6.978713512420654,
    -5.068508625030518,
    6.288288116455078,
    -13.324929237365723,
    2.51578950881958,
    2.6000137329101562,
    14.219351768493652,
    5.4554643630981445,
    5.286128044128418,
    -3.8965466022491455,
    -6.05485200881958,
    11.869226455688477,
    -11.307221412658691,
    -1.5087023973464966,
    -8.646753311157227,
    0.44821596145629883,
    8.66211986541748,
    8.303625106811523,
    13.985923767089844,
    -0.19615978002548218
  ],
  [
    4.50189208984375,
    -4.935824394226074,
    -0.042005181312561035,
    2.3175597190856934,
    4.412976264953613,
    -13.736227035522461,
    -13.990167617797852,
    19.076614379882812,
    -3.8637607097625732,
    -2.875369071960449,
    9.681108474731445,
    14.190940856933594,
    -6.300146102905273,
    -2.748384475708008,
    -10.67545223236084,
    -15.081766128540039,
    -3.3130884170532227,
    1.7095024585723877,
    -10.340690612792969,
    -2.966965675354004,
    -3.59036922454834,
    13.048643112182617,
    10.338794708251953,
    12.132885932922363,
    12.364285469055176
  ],
  [
    4.14584493637085,
    -2.2263107299804688,
    3.047293186187744,
    3.635033130645752,
    0.31205978989601135,
    1.8614319562911987,
    -9.546428680419922,
    5.078840732574463,
    0.3299643397331238,
    2.897230625152588,
    1.3299314975738525,
    0.7351471185684204,
    5.249790191650391,
    -3.529052495956421,
    -3.4212493896484375,
    -5.099746227264404,
    8.956042289733887,
    -2.9340271949768066,
    0.8110866546630859,
    2.8502562046051025,
    -4.7403388023376465,
    -4.358865261077881,
    2.9119772911071777,
    7.022226810455322,
    2.365488290786743
  ]
]
const expectedEmbeddings = [
  0.1341326675190514,
  -0.06254902975677054,
  0.16151883689646443,
  -0.09876129247260174,
  0.11536730381631702,
  -0.09501117502566522,
  -0.25369285613049697,
  0.24317262203117693,
  -0.07165771082652404,
  -0.019598536174092393,
  0.0469875331544465,
  0.2491950533824863,
  -0.11707818403666244,
  -0.1961129818560888,
  -0.20147780442964816,
  -0.14759219473910062,
  0.07769623209882123,
  -0.0029155425803427614,
  -0.18939382527025744,
  -0.10210364508880357,
  -0.11266725049833885,
  0.23113461596466228,
  0.17243578054811445,
  0.04260804160159498,
  0.10276822801312079
]

const globalTFIDF = {
  i: 1.1983333333333335,
  need: 0.39333333333333337,
  advice: 0.16333333333333333,
  regarding: 0.20166666666666666,
  my: 1.045,
  statements: 0.16333333333333333,
  invoice: 0.2783333333333333,
  is: 0.6616666666666667,
  incorrectly: 0.16333333333333333,
  calculated: 0.16333333333333333,
  there: 0.20166666666666666,
  a: 0.4316666666666667,
  mistake: 0.16333333333333333,
  on: 0.31666666666666665,
  statement: 0.31666666666666665,
  want: 0.31666666666666665,
  to: 0.6233333333333333,
  see: 0.16333333333333333,
  the: 0.2783333333333333,
  details: 0.16333333333333333,
  of: 0.16333333333333333,
  what: 0.4316666666666667,
  do: 0.20166666666666666,
  if: 0.20166666666666666,
  have: 0.31666666666666665,
  an: 0.2783333333333333,
  inquiry: 0.16333333333333333,
  about: 0.20166666666666666,
  does: 0.16333333333333333,
  not: 0.2783333333333333,
  make: 0.16333333333333333,
  sense: 0.16333333333333333,
  monthly: 0.16333333333333333,
  incorrect: 0.16333333333333333,
  how: 0.2783333333333333,
  can: 0.39333333333333337,
  figure: 0.16333333333333333,
  out: 0.16333333333333333,
  im: 0.16333333333333333,
  paying: 0.16333333333333333,
  for: 0.20166666666666666,
  questions: 0.16333333333333333,
  invoices: 0.16333333333333333,
  get: 0.20166666666666666,
  clarification: 0.16333333333333333,
  charge: 0.16333333333333333,
  wrong: 0.20166666666666666,
  dont: 0.16333333333333333,
  understand: 0.16333333333333333,
  something: 0.2783333333333333,
  end: 0.355,
  contract: 0.47000000000000003,
  subscription: 0.20166666666666666,
  stop: 0.24,
  cancel: 0.20166666666666666,
  terminate: 0.16333333333333333,
  it: 0.2783333333333333,
  possible: 0.16333333333333333,
  now: 0.16333333333333333,
  agreement: 0.16333333333333333,
  with: 0.16333333333333333,
  you: 0.31666666666666665,
  please: 0.20166666666666666,
  give: 0.24,
  me: 0.24,
  your: 0.39333333333333337,
  help: 0.16333333333333333,
  line: 0.16333333333333333,
  number: 0.585,
  phone: 0.20166666666666666,
  best: 0.16333333333333333,
  reach: 0.20166666666666666,
  call: 0.16333333333333333,
  in: 0.16333333333333333,
  contact: 0.24,
  business: 0.16333333333333333,
  should: 0.16333333333333333,
  use: 0.16333333333333333,
  seems: 0.16333333333333333,
  like: 0.16333333333333333,
  technical: 0.31666666666666665,
  problem: 0.355,
  support: 0.16333333333333333,
  cant: 0.16333333333333333,
  continue: 0.16333333333333333,
  got: 0.24,
  working: 0.24,
  right: 0.20166666666666666,
  error: 0.16333333333333333,
  computer: 0.20166666666666666,
  issue: 0.16333333333333333,
  ive: 0.16333333333333333
}
