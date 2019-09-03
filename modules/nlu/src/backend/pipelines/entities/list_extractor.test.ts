import 'bluebird-global'
import _ from 'lodash'

import {
  ChunkSlotsInUtterance,
  EntityExtractionResult,
  extractListEntities,
  ListEntityModel,
  Utterance,
  UtteranceClass
} from '../../engine2'

const T = (utterance: string): string[] => utterance.split(/( )/g)

let TEST_IS_FUZZY = true

const list_entities: ListEntityModel[] = [
  {
    entityName: 'fruit',
    fuzzyMatching: true,
    id: 'custom.list.fruit',
    languageCode: 'en',
    mappingsTokens: {
      Blueberry: ['blueberries', 'blueberry', 'blue berries', 'blue berry', 'poisonous blueberry'].map(T),
      Strawberry: ['strawberries', 'strawberry', 'straw berries', 'straw berry'].map(T),
      Raspberry: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'].map(T),
      Apple: ['apple', 'apples', 'red apple', 'yellow apple'].map(T)
    },
    get sensitive(): boolean {
      return TEST_IS_FUZZY
    },
    type: 'custom.list'
  },
  {
    entityName: 'company',
    fuzzyMatching: true,
    id: 'custom.list.company',
    languageCode: 'en',
    mappingsTokens: {
      Apple: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'].map(T)
    },
    sensitive: false,
    type: 'custom.list'
  }
]

describe.only('list_extractor > structure', () => {
  test('Data structure test', async () => {
    TEST_IS_FUZZY = true
    const utterance = textToUtterance('Blueberries are berries that are blue')
    const results = extractListEntities(utterance, list_entities)

    expect(results).toHaveLength(1)
    expect(results[0].value).toBe('Blueberry')
    expect(results[0].start).toBe(0)
    expect(results[0].end).toBe(11)
    expect(results[0].type).toBe('fruit')
    expect(results[0].confidence).toBeGreaterThan(0.9)
    expect(results[0].metadata.source).toBe('Blueberries')
    expect(results[0].metadata.occurance).toBe('blueberries')
  })
})

describe('list_extractor > exact match', () => {
  TEST_IS_FUZZY = false
  assertEntity('[Blueberries](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
  assertEntity('[Blue berries](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
  assertEntity('[blueberry](qty:1 type:fruit value:Blueberry confidence:0.9) are berries that are blue')
  assertEntity('blueberry [are berries that are blue](qty:0)')
  assertEntity('but [strawberries](qty:1 value:Strawberry) are red unlike [blueberries](qty:1 value:Blueberry)')
  assertEntity('[but](qty:0) strawberries [are red unlike](qty:0) blueberries')
  assertEntity(
    'an [apple](qty:2 type:fruit type:company confidence:0.90) can be a fruit but also [apple corporation](qty:2 type:company confidence:0.9)'
  )
  assertEntity('that is a [poisonous blueberry](qty:1 value:Blueberry confidence:1)')
  assertEntity('the [red apple](qty:2 type:fruit confidence:0.9) corporation')
  assertEntity('the red [apple corporation](qty:2 type:company)')
  assertEntity('the [red](qty:1) apple [corporation](qty:1)')
  assertEntity('[apple](qty:2)')
  assertEntity('[apple inc](qty:2)')
})

describe.only('list_extractor > fuzzy match', () => {
  TEST_IS_FUZZY = true

  // missing characters
  assertEntity('[Bluebrries](qty:1 value:Blueberry) are berries that are blue')
  assertEntity('[Blueberies](qty:1 value:Blueberry) are berries that are blue')
  assertEntity('[Bluberies](qty:1 value:Blueberry) are berries that are blue')
  assertEntity('that is a [poisonous bleberry](qty:1 value:Blueberry confidence:0.9)') // the longer the word, the more we tolerate mistakes
  assertEntity('that is a [poisonus bleberry](qty:1 value:Blueberry confidence:0.8)') // prefer 'poisonous blueberry' to 'blueberry'
  assertEntity('[aple](qty:1)') // Apple the company has a capital 'A'

  // added chars
  assertEntity('[apple](qty:2) [corporations](qty:1) [inc](qty:0)') // corporation with a S
  assertEntity('[Apple a Corporation](type:company)')

  // too much added chars
  assertEntity('[apple](qty:1) [Zcorporationss](qty:0) [inc](qty:0)')
  assertEntity('[Apple](qty:2) [build Computers](qty:0)')

  // missing too much chars
  assertEntity('[ale](qty:0)')
  assertEntity('[Blberies](qty:0) are berries that are blue')
  assertEntity('[bberries](qty:0) are berries that are blue')
  assertEntity('[blberries](qty:0) are berries that are blue')
  assertEntity('[bberries are berries that are blue](qty:0)')
  assertEntity('that is a [poison](qty:0) [blueberry](qty:1 value:Blueberry confidence:0.9)') // prefer 'blueberry' to 'poisonous blueberry'

  // minor bad keystokes
  assertEntity('[blurberries](qty:1 value:Blueberry confidence:0.8) are berries that are blue')
  assertEntity('[poisoneous blurberries](qty:1 value:Blueberry confidence:0.8) are berries that are blue')

  // major bad keystrokes
  assertEntity('[bluabarrias](qty:0) are berries that are blue')
  assertEntity('[vluqberies](qty:0) are berries that are blue')
  assertEntity('[blumberries](qty:0) are berries that are blue')

  // minor letter reversal
  assertEntity('[blueebrries](qty:1 value:Blueberry) are berries that are blue')

  // letter reversal + missing char
  assertEntity('[lbuberries](qty:0) are berries that are blue')

  // no others
  assertEntity('Blueberries [are berries that are blue](qty:0)')
})

///////////////////
////// HELPERS
///////////////////

function assertEntity(expression: string) {
  const chunks = ChunkSlotsInUtterance(expression, [])
  const text = chunks.map(x => x.value).join('')
  const parts = chunks
    .filter(x => !!x.slotName)
    .map(x => x.value)
    .join(',')
  let cursor = 0

  const utterance = textToUtterance(text)
  const results = extractListEntities(utterance, list_entities)

  for (const chunk of chunks) {
    if (!chunk.slotName) {
      cursor += chunk.value.length
      continue
    }

    const chunkStart = cursor
    const chunkEnd = cursor + chunk.value.length
    cursor += chunk.value.length
    const found = results.filter(
      x => (x.start >= chunkStart && x.start < chunkEnd) || (x.end <= chunkEnd && x.end > chunkStart)
    )

    const conditions = chunk.slotName.split(' ')

    const cases = []
    let t: EntityExtractionResult = undefined

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
      cases.push(['start', chunkStart, t.start])
      cases.push(['end', chunkEnd, t.end])
    }

    test.each(cases)(`"${text}" (${parts}) '%s' -> Expected(%s) Actual(%s)`, (expression, a, b) => {
      if (expression === 'confidence') {
        expect(Number(b)).toBeGreaterThan(Number(a))
      } else if (['qty', 'start', 'end'].includes(expression)) {
        expect(Number(b)).toEqual(Number(a))
      } else {
        expect(b).toBe(a)
      }
    })
  }
}

function textToUtterance(txt: string): Utterance {
  const tokens = T(txt)
  const vectors = tokens.map(() => new Array(100).fill(0))
  return new UtteranceClass(tokens, vectors)
}
