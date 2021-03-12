import 'bluebird-global'
import { makeTestUtterance } from '../test-utils/fake-utterance'

import { EntityExtractionResult, ListEntityModel } from '../typings'
import { parseUtterance } from 'common/utterance-parser'

import { extractListEntities } from './custom-entity-extractor'

const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
}

const T = (utterance: string): string[] => utterance.split(/( )/g)

const list_entities: ListEntityModel[] = [
  {
    entityName: 'fruit',
    fuzzyTolerance: FuzzyTolerance.Medium,
    id: 'custom.list.fruit',
    languageCode: 'en',
    mappingsTokens: {
      Blueberry: ['blueberries', 'blueberry', 'blue berries', 'blue berry', 'poisonous blueberry'].map(T),
      Strawberry: ['strawberries', 'strawberry', 'straw berries', 'straw berry'].map(T),
      Raspberry: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'].map(T),
      Apple: ['apple', 'apples', 'red apple', 'yellow apple'].map(T)
    },
    sensitive: true,
    type: 'custom.list'
  },
  {
    entityName: 'company',
    fuzzyTolerance: FuzzyTolerance.Medium,
    id: 'custom.list.company',
    languageCode: 'en',
    mappingsTokens: {
      Apple: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'].map(T)
    },
    sensitive: false,
    type: 'custom.list'
  },
  {
    entityName: 'airport',
    fuzzyTolerance: FuzzyTolerance.Medium,
    id: 'custom.list.airport',
    languageCode: 'en',
    mappingsTokens: {
      JFK: ['JFK', 'New-York', 'NYC'].map(T),
      SFO: ['SFO', 'SF', 'San-Francisco'].map(T),
      YQB: ['YQB', 'Quebec', 'Quebec city', 'QUEB'].map(T)
    },
    sensitive: false,
    type: 'custom.list'
  }
]
describe('list entity extractor', () => {
  test('Sensitivity flag', () => {
    const utt = makeTestUtterance('YQB is as bad as that poisonous blueberry')
    const res = extractListEntities(utt, list_entities)
    expect(res.find(e => e.type === 'fruit')!.sensitive).toBeTruthy()
    expect(res.find(e => e.type === 'airport')!.sensitive).not.toBeTruthy()
  })

  test('Data structure test', async () => {
    const utterance = makeTestUtterance('Blueberries are berries that are blue')
    const results = extractListEntities(utterance, list_entities)

    expect(results).toHaveLength(1)
    expect(results[0].value).toBe('Blueberry')
    expect(results[0].start).toBe(0)
    expect(results[0].end).toBe(11)
    expect(results[0].type).toBe('fruit')
    expect(results[0].confidence).toBeGreaterThan(0.9)
    expect(results[0].metadata.source).toBe('Blueberries')
    expect(results[0].metadata.occurrence).toBe('blueberries')
  })

  describe('exact match', () => {
    assertEntity('[Blueberries](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
    assertEntity('[Blue berries](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
    assertEntity('[blueberry](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
    assertEntity('blueberry [are berries that are blue](qty:0)') // are berries match rasp berries
    assertEntity('but [strawberries](qty:1 value:Strawberry) are red unlike [blueberries](qty:1 value:Blueberry)')
    assertEntity('[but](qty:0) strawberries [are red unlike](qty:0) blueberries')
    assertEntity(
      'an [apple](qty:2 type:fruit confidence:0.90) can be a fruit but also [apple corporation](qty:2 type:company confidence:0.85)'
    )
    assertEntity('that is a [poisonous blueberry](qty:1 value:Blueberry confidence:1)')
    assertEntity('the [red apple](qty:2 type:fruit confidence:0.9) corporation')
    assertEntity('the red [apple corporation](qty:2 type:company)')
    assertEntity('the [red](qty:1) apple [corporation](qty:1)')
    assertEntity('[apple](qty:2)')
    assertEntity('[apple inc](qty:2)')
    assertEntity(
      '[SF](qty:1 type:airport) is where I was born, I now live in [Quebec](qty:1 type:airport) [the city](qty:0)'
    )
  })

  describe('same occurence in multiple entities extracts multiple entities', () => {
    // arrange
    const test_entities: ListEntityModel[] = [
      ...list_entities,
      {
        entityName: 'state',
        fuzzyTolerance: FuzzyTolerance.Medium,
        id: 'custom.list.state',
        languageCode: 'en',
        mappingsTokens: {
          NewYork: ['New York'].map(T)
        },
        sensitive: false,
        type: 'custom.list'
      },
      {
        entityName: 'city',
        fuzzyTolerance: FuzzyTolerance.Medium,
        id: 'custom.list.city',
        languageCode: 'en',
        mappingsTokens: {
          NewYork: ['New York'].map(T)
        },
        sensitive: false,
        type: 'custom.list'
      }
    ]

    const expectedIds = ['custom.list.state', 'custom.list.city', 'custom.list.airport']
    const utterance = makeTestUtterance('I want to go to New York')

    // act
    const results = extractListEntities(utterance, test_entities)

    // assert
    expect(results.length).toEqual(3)

    for (let result of results) {
      const { entityId } = result.metadata
      test(`Expect ${result.value} to be one of ${expectedIds.join(' ')}`, () => {
        expectedIds.includes(entityId)
      })
    }
  })

  describe('fuzzy match', () => {
    describe('loose fuzzy', () => {
      assertEntity('[Qebec citty](qty:1 value:YQB) is a city within [QC](qty:0), a provice.')
      assertEntity('A quaterback is also called a [QB](qty:0) and [sn francisco](qty:1 value:SFO) used to have one')
      assertEntity('[sn frncisco](qty:0) is nice but for [New-Yorkers](qty:0) [new-yrk](qty:1 value:JFK) is better')
      assertEntity("I never been to [kbec city](qty:0) but I've been to [kebec city](qty:1 value:YQB)")
      assertEntity("Let's go to [Nova-York](qty:0)")
    })

    describe('missing characters', () => {
      assertEntity('[Bluebrries](qty:1 value:Blueberry) are berries that are blue')
      assertEntity('[Blueberies](qty:1 value:Blueberry) are berries that are blue')
      assertEntity('[Bluberies](qty:1 value:Blueberry) are berries that are blue')
      assertEntity('that is a [poisonous bleberry](qty:1 value:Blueberry confidence:0.9)') // the longer the word, the more we tolerate mistakes
      assertEntity('that is a [poisonus bleberry](qty:1 value:Blueberry confidence:0.8)') // prefer 'poisonous blueberry' to 'blueberry'
    })

    describe('added chars', () => {
      assertEntity('[apple](qty:2) [corporations](qty:1) [inc](qty:0)') // corporation with a S
      assertEntity('[Apple a Corporation](type:company)')
      assertEntity('[apple](qty:2) [coroporations](qty:1) [inc](qty:0)')
      // too many added chars
      assertEntity('[Apple](qty:2) [build Computers](qty:0)')
      assertEntity('[apple](qty:2) [Zcoroporationss](qty:0) [inc](qty:0)')
    })

    describe('too many missing chars', () => {
      assertEntity('[ale](qty:0)')
      assertEntity('[Blberies](qty:0) are berries that are blue')
      assertEntity('[bberries](qty:0) are berries that are blue')
      assertEntity('that is a [poison](qty:0) [blueberry](qty:1 value:Blueberry confidence:0.9)') // prefer 'blueberry' to 'poisonous blueberry'
      assertEntity('[blberries](qty:1) are berries that are blue')
      assertEntity('[bberries are berries that are blue](qty:0)')
    })

    describe('casing issues', () => {
      assertEntity('[queb](qty:1 value:YQB confidence:0.7) is the place')
      assertEntity('[Queb](qty:1 value:YQB confidence:0.75) is the place')
      assertEntity('[QUeb](qty:1 value:YQB confidence:0.8) is the place')
      assertEntity('[QUEb](qty:1 value:YQB confidence:0.85) is the place')
      assertEntity('[QUEB](qty:1 value:YQB confidence:0.9) is the place')
      assertEntity('[yqb](qty:0) is the place') // less than 4 chars

      // casing + typos
      // this will need better structural scoring
      // assertEntity('[AppLe](qty:1 type:company) is a company, not a fruit')
      // assertEntity('[aple](qty:1)') // Apple the company has a capital 'A'
    })

    describe('bad keystrokes', () => {
      // minor
      assertEntity('[blurberries](qty:1 value:Blueberry confidence:0.8) are berries that are blue')
      assertEntity('[poisoneouss blurberry](qty:1 value:Blueberry confidence:0.8) are berries that are blue')
      // major
      assertEntity('[vluqberries](qty:0) are berries that are blue')
      // assertEntity('[blumbeerries](qty:0) are berries that are blue') // this needs keyboard distance computation
      // assertEntity('[bluabarrias](qty:0) are berries that are blue') // this needs keyboard distance computation
      // minor letter reversal
      assertEntity('[blueebrries](qty:1 value:Blueberry) are berries that are blue')
      // letter reversal + missing char
      assertEntity('[lbuberries](qty:0) are berries that are blue')
    })

    // no others
    assertEntity('Blueberries [are berries that are blue](qty:0)')
  })
})

///////////////////
////// HELPERS
///////////////////

function assertEntity(expression: string) {
  const { utterance: text, parsedSlots } = parseUtterance(expression)
  const parts = parsedSlots.map(p => p.value)

  const utterance = makeTestUtterance(text)
  const results = extractListEntities(utterance, list_entities)

  for (const strConds of parsedSlots) {
    const { start, end } = strConds.cleanPosition
    const found = results.filter(x => (x.start >= start && x.start < end) || (x.end <= end && x.end > start))

    const conditions = strConds.name.split(' ')

    const cases: [string, number | string, number | string][] = []
    let t: EntityExtractionResult | undefined = undefined

    for (const [name, value] of conditions.map(x => x.split(':'))) {
      if (name === 'qty') {
        cases.push(['qty', value, found.length])
      } else if (name === 'type') {
        t = found.find(x => x.type === value)
        cases.push(['type', value, t ? t.type : 'N/A'])
      } else if (name === 'value') {
        t = found.find(x => x.value === value)
        cases.push(['value', value, t ? t.value : 'N/A'])
      } else if (name === 'confidence' && t) {
        cases.push(['confidence', value, t.confidence])
      }
    }

    if (t) {
      cases.push(['start', start, t.start])
      cases.push(['end', end, t.end])
    }

    test.each(cases)(`"${text}" (${parts}) '%s' -> Expected(%s) Actual(%s)`, (expression, a, b) => {
      if (expression === 'confidence') {
        expect(Number(b)).toBeGreaterThanOrEqual(Number(a))
      } else if (['qty', 'start', 'end'].includes(expression)) {
        expect(Number(b)).toEqual(Number(a))
      } else {
        expect(b).toEqual(a)
      }
    })
  }
}
