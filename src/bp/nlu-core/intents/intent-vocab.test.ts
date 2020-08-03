import { POSClass } from '../language/pos-tagger'
import { SPACE } from '../tools/token-utils'
import { buildIntentVocab } from '../training-pipeline'
import { ExtractedSlot, ListEntityModel } from '../typings'
import Utterance from '../utterance/utterance'

const LIST_ENTITIES: ListEntityModel[] = [
  {
    entityName: 'flights',
    type: 'custom.list',
    fuzzyTolerance: 0.8,
    id: 'entId',
    mappingsTokens: {
      'Air Canada': [
        ['Air', SPACE, 'Canada'],
        ['air', 'can']
      ]
    },
    languageCode: 'en',
    sensitive: false
  }
]

const u1Toks = 'Hello my friend my name is Carl'.split(/(\s)/)
const u2Toks = 'hello Anthony you look different. Anything new?'.split(/(\s)/)

const genMockVectors = (toks: string[]): number[][] => new Array(toks.length).fill([0, 0])
const genMockPOS = (toks: string[]): POSClass[] => new Array(toks.length).fill('N/A')

describe('Build intent vocab', () => {
  test('Empty vocab', () => {
    expect(buildIntentVocab([], [])).toEqual({})
  })

  test('With list entities only', () => {
    const intVocab = buildIntentVocab([], LIST_ENTITIES)

    expect(intVocab['hello']).toBeUndefined()
    expect(intVocab[SPACE]).toBeUndefined()
    expect(intVocab[' ']).toBeTruthy()
    expect(intVocab['air']).toBeTruthy()
    expect(intVocab['Air']).toBeUndefined()
    expect(intVocab['Air Canada']).toBeUndefined()
    expect(intVocab['air canada']).toBeUndefined()
    expect(intVocab['Canada']).toBeUndefined()
    expect(intVocab['canada']).toBeTruthy()
    expect(intVocab['can']).toBeTruthy()
  })

  test('With utterance tokens only', () => {
    const u1 = new Utterance(u1Toks, genMockVectors(u1Toks), genMockPOS(u1Toks), 'en')
    const u2 = new Utterance(u2Toks, genMockVectors(u2Toks), genMockPOS(u2Toks), 'en')

    const intVocab = buildIntentVocab([u1, u2], [])
    const allUtoks = [...u1Toks, ...u2Toks]

    expect(intVocab['air']).toBeUndefined()
    expect(intVocab['Air']).toBeUndefined()
    expect(intVocab['Air Canada']).toBeUndefined()
    expect(intVocab['air canada']).toBeUndefined()
    expect(intVocab['Canada']).toBeUndefined()
    expect(intVocab['canada']).toBeUndefined()
    expect(intVocab['can']).toBeUndefined()
    allUtoks
      .map((t: string) => t.toLowerCase())
      .forEach(t => {
        expect(intVocab[t]).toBeTruthy()
      })
  })

  test('With list entities and Utterance tokens', () => {
    const u1 = new Utterance(u1Toks, genMockVectors(u1Toks), genMockPOS(u1Toks), 'en')
    const u2 = new Utterance(u2Toks, genMockVectors(u2Toks), genMockPOS(u2Toks), 'en')

    const intVocab = buildIntentVocab([u1, u2], LIST_ENTITIES)
    const allUtoks = [...u1Toks, ...u2Toks]

    expect(intVocab[SPACE]).toBeUndefined()
    expect(intVocab[' ']).toBeTruthy()
    expect(intVocab['air']).toBeTruthy()
    expect(intVocab['Air']).toBeUndefined()
    expect(intVocab['Air Canada']).toBeUndefined()
    expect(intVocab['air canada']).toBeUndefined()
    expect(intVocab['Canada']).toBeUndefined()
    expect(intVocab['canada']).toBeTruthy()
    expect(intVocab['can']).toBeTruthy()
    allUtoks
      .map((t: string) => t.toLowerCase())
      .forEach(t => {
        expect(intVocab[t]).toBeTruthy()
      })
  })

  test('Some tokens with tagged slots', () => {
    const u1 = new Utterance(u1Toks, genMockVectors(u1Toks), genMockPOS(u1Toks), 'en')
    u1.tagSlot({ name: 'person' } as ExtractedSlot, 6, 16) // slot is: "my friend"

    const intVocab = buildIntentVocab([u1], [])

    expect(intVocab['friend']).toBeUndefined() // not added because there's a slot
    expect(intVocab['my']).toBeTruthy() // my is added because of its 2nd appearance
  })
})
