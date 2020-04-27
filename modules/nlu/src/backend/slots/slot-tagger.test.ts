import { BIO, ExtractedEntity, ExtractedSlot, Intent } from '../typings'
import Utterance, { makeTestUtterance } from '../utterance/utterance'

import { labelizeUtterance, makeExtractedSlots, TagResult } from './slot-tagger'

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
  const testIntent = {
    slot_entities: ['CS_Field']
  } as Intent<Utterance>

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

    const extractedSlots = makeExtractedSlots(testIntent, u, tagResults)

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

    const extractedSlots = makeExtractedSlots(testIntent, u, tagResults)

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
    u.tagEntity({ type: 'CS_Field', value } as ExtractedEntity, 19, 21)

    const extractedSlots = makeExtractedSlots(testIntent, u, tagResults)

    expect(extractedSlots.length).toEqual(1)
    expect(extractedSlots[0].slot.source).toEqual('big AI')
    expect(extractedSlots[0].slot.value).toEqual(value)
  })

  test('slot with entities but not set in intent def keeps source as value', () => {
    tagResults.splice(
      6,
      2,
      { name: 'action', probability: 1, tag: BIO.BEGINNING },
      { name: 'action', probability: 1, tag: BIO.INSIDE }
    )
    u.tagEntity({ type: 'verb', value: 'to watch' } as ExtractedEntity, 25, 33)

    const extractedSlots = makeExtractedSlots(testIntent, u, tagResults)

    expect(extractedSlots.length).toEqual(1)
    expect(extractedSlots[0].slot.source).toEqual('is watching')
    expect(extractedSlots[0].slot.value).toEqual('is watching')
  })
})
