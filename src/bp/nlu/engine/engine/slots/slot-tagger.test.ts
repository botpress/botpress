import _ from 'lodash'
import { makeTestUtterance } from '../test-utils/fake-utterance'

import { BIO, ExtractedEntity, ExtractedSlot } from '../typings'
import Utterance from '../utterance/utterance'

import SlotTagger, { labelizeUtterance, makeExtractedSlots } from './slot-tagger'
import { TagResult } from './typings'
import { makeFakeTools } from '../test-utils/fake-tools'
import { ModelLoadingError } from '../../errors'

const fakeTools = makeFakeTools(300, ['en'])
const dummyProgress = (p: number) => {}

const dudeWheresMyCar = makeTestUtterance("Dude, where's my car?")

describe('Slot tagger labels for utterance', () => {
  test('without slots', () => {
    const u = makeTestUtterance('My name is Heisenberg and I am the danger')
    const labels = labelizeUtterance(u)

    expect(labels.length).toEqual(u.tokens.filter(t => !t.isSpace).length)
    labels.forEach(l => expect(l).toEqual('o'))
  })

  test('with slots', () => {
    const u = makeTestUtterance('Careful my friend Alex W is one of us')
    //                           0123456789012345678901234567890123456
    //                           ________---------_-------__________--

    u.tagSlot({ name: 'listener', source: 'my friend' } as ExtractedSlot, 8, 17)
    u.tagEntity({ value: 'my friend', type: 'friend' } as ExtractedEntity, 8, 17)
    u.tagSlot({ name: 'person', source: 'Alex W' } as ExtractedSlot, 18, 24)
    u.tagSlot({ name: 'group', source: 'us' } as ExtractedSlot, 35, 37)

    const labels = labelizeUtterance(u)

    expect(labels.length).toEqual(u.tokens.filter(t => !t.isSpace).length)
    expect(labels[1]).toEqual('B-listener')
    expect(labels[2]).toEqual('I-listener')

    expect(labels[3]).toEqual('B-person/any')
    expect(labels[4]).toEqual('I-person/any')

    expect(labels[8]).toEqual('B-group/any')

    labels
      .filter((l, idx) => ![1, 2, 3, 4, 8].includes(idx))
      .forEach(l => {
        expect(l).toEqual('o')
      })
  })
})

describe('makeExtractedSlots', () => {
  let u: Utterance
  const out: TagResult = { name: '', tag: BIO.OUT, probability: 1 }
  let tagResults: TagResult[]
  const slot_entities = ['CS_Field']

  beforeEach(() => {
    u = makeTestUtterance('No one is safe big AI is watching')
    //                     0123456789012345678901234567890123
    tagResults = new Array(u.tokens.filter(t => !t.isSpace).length).fill(out)
  })

  test('consecutive slots token combined properly', () => {
    tagResults.splice(
      4,
      2,
      { name: 'threath', probability: 1, tag: BIO.BEGINNING },
      { name: 'threath', probability: 1, tag: BIO.INSIDE }
    )

    const extractedSlots = makeExtractedSlots(slot_entities, u, tagResults)

    expect(extractedSlots.length).toEqual(1)
    expect(extractedSlots[0].slot.source).toEqual('big AI')
    expect(extractedSlots[0].slot.value).toEqual('big AI')
    expect(extractedSlots[0].start).toEqual(15)
    expect(extractedSlots[0].end).toEqual(21)
  })

  test('consecutive different slots are not combined', () => {
    tagResults.splice(
      4,
      4,
      { name: 'threath', probability: 1, tag: BIO.BEGINNING },
      { name: 'threath', probability: 1, tag: BIO.INSIDE },
      { name: 'action', probability: 1, tag: BIO.BEGINNING },
      { name: 'action', probability: 1, tag: BIO.INSIDE }
    )

    const extractedSlots = makeExtractedSlots(slot_entities, u, tagResults)

    expect(extractedSlots.length).toEqual(2)
    expect(extractedSlots[0].slot.source).toEqual('big AI')
    expect(extractedSlots[0].slot.value).toEqual('big AI')
    expect(extractedSlots[0].start).toEqual(15)
    expect(extractedSlots[0].end).toEqual(21)
    expect(extractedSlots[1].slot.source).toEqual('is watching')
    expect(extractedSlots[1].slot.value).toEqual('is watching')
    expect(extractedSlots[1].start).toEqual(22)
    expect(extractedSlots[1].end).toEqual(33)
  })

  test('slot with associated entities adds proper value', () => {
    tagResults.splice(
      4,
      2,
      { name: 'threath', probability: 1, tag: BIO.BEGINNING },
      { name: 'threath', probability: 1, tag: BIO.INSIDE }
    )
    const value = 'Artificial Intelligence'
    const entity = { type: 'CS_Field', value, confidence: 0.42, sensitive: false, metadata: {} } as ExtractedEntity
    u.tagEntity(entity, 19, 21)

    const extractedSlots = makeExtractedSlots(slot_entities, u, tagResults)

    expect(extractedSlots.length).toEqual(1)
    expect(extractedSlots[0].slot.source).toEqual('big AI')
    expect(extractedSlots[0].slot.value).toEqual(value)

    const actualEntity = _.omit(extractedSlots[0].slot.entity, 'start', 'end')
    expect(actualEntity).toEqual(entity)
  })

  test('slot with entities but not set in intent def keeps source as value', () => {
    tagResults.splice(
      6,
      2,
      { name: 'action', probability: 1, tag: BIO.BEGINNING },
      { name: 'action', probability: 1, tag: BIO.INSIDE }
    )
    u.tagEntity({ type: 'verb', value: 'to watch' } as ExtractedEntity, 25, 33)

    const extractedSlots = makeExtractedSlots(slot_entities, u, tagResults)

    expect(extractedSlots.length).toEqual(1)
    expect(extractedSlots[0].slot.entity).toBeUndefined()
    expect(extractedSlots[0].slot.source).toEqual('is watching')
    expect(extractedSlots[0].slot.value).toEqual('is watching')
  })
})

describe('Slot tagger component lifecycle', () => {
  test('Slot tagger with no slots should predict empty array', async () => {
    let slotTagger = new SlotTagger(fakeTools)
    await slotTagger.train(
      {
        intent: {
          name: 'someIntent',
          contexts: [],
          utterances: [dudeWheresMyCar],
          slot_definitions: []
        },
        list_entites: []
      },
      dummyProgress
    )

    const model = slotTagger.serialize()
    slotTagger = new SlotTagger(fakeTools)
    await slotTagger.load(model)

    const prediction = await slotTagger.predict(dudeWheresMyCar)
    expect(prediction.length).toBe(0)
  })

  test('When model is corrupted, loading throws', async () => {
    const slotTagger = new SlotTagger(fakeTools)
    await slotTagger.train(
      {
        intent: {
          name: 'someIntent',
          contexts: [],
          utterances: [dudeWheresMyCar],
          slot_definitions: []
        },
        list_entites: []
      },
      dummyProgress
    )

    const model = slotTagger.serialize()

    // act && asert
    await expect(slotTagger.load(`${model} I'm not a rapper`)).rejects.toThrowError(ModelLoadingError)

    const parsed = JSON.parse(model)
    parsed['someKey'] = 'someValue'
    await expect(slotTagger.load(JSON.stringify(parsed))).rejects.toThrowError(ModelLoadingError)

    const undef: unknown = undefined
    await expect(slotTagger.load(undef as string)).rejects.toThrowError(ModelLoadingError)
  })

  // TODO: add a fake CRF tagger to the fake tools and assert the slot tagger works well as a whole
})
