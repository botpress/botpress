import { ExtractedEntity, ExtractedSlot, Utterance } from './engine2'

import { labelizeUtterance } from './labeler2'

describe('CRF labels for utterance', () => {
  test('without slots', () => {
    const toks = 'My mame is Heisenberg and I am the danger'.split(/(\s)/g)
    const utterance = new Utterance(toks, new Array(toks.length).fill([0]))

    const labels = labelizeUtterance(utterance)

    labels.forEach(l => expect(l).toEqual('o'))
  })

  test('with slots', () => {
    const toks = 'Careful my friend, Alex W. is one of us'.split(/(\s)/g)
    const utterance = new Utterance(toks, new Array(toks.length).fill([0]))
    utterance.tagSlot({ name: 'listener', source: 'my friend' } as ExtractedSlot, 8, 18)
    utterance.tagEntity({ value: 'my friend', type: 'friend' } as ExtractedEntity, 8, 18)
    utterance.tagSlot({ name: 'person', source: 'Alex W.' } as ExtractedSlot, 19, 26)
    utterance.tagSlot({ name: 'group', source: 'us' } as ExtractedSlot, 37, 39)

    const labels = labelizeUtterance(utterance)

    expect(labels[2]).toEqual('B-listener')
    expect(labels[3]).toEqual('I-listener')
    expect(labels[4]).toEqual('I-listener')

    expect(labels[6]).toEqual('B-person/any')
    expect(labels[7]).toEqual('I-person/any')
    expect(labels[8]).toEqual('I-person/any')

    expect(labels[16]).toEqual('B-group/any')

    Array.from([0, 1, 5, 9, 10, 11, 12, 13, 14, 15]).forEach(i => {
      expect(labels[i]).toEqual('o')
    })
  })
})
