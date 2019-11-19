import { ExtractedEntity, ExtractedSlot } from './engine2'
import { labelizeUtterance } from './labeler2'
import Utterance from './utterance'

describe('CRF labels for utterance', () => {
  test('without slots', () => {
    const toks = 'My mame is Heisenberg and I am the danger'.split(/(\s)/g)
    const utterance = new Utterance(toks, new Array(toks.length).fill([0]), 'en')

    const labels = labelizeUtterance(utterance)

    expect(labels.length).toEqual(utterance.tokens.filter(t => !t.isSpace).length)
    labels.forEach(l => expect(l).toEqual('o'))
  })

  test('with slots', () => {
    const toks = 'Careful my friend, Alex W. is one of us'.split(/(\s)/g)
    //            012345678901234567890123456789012345678
    //            ________---------__-------___________--
    const utterance = new Utterance(toks, new Array(toks.length).fill([0]), 'en')
    utterance.tagSlot({ name: 'listener', source: 'my friend' } as ExtractedSlot, 8, 18) // 18 because we want to include the ',' (for testing purposes) since we're not tokenizing wisely
    utterance.tagEntity({ value: 'my friend', type: 'friend' } as ExtractedEntity, 8, 18) // 18 because we want to include the ',' (for testing purposes) since we're not tokenizing wisely
    utterance.tagSlot({ name: 'person', source: 'Alex W.' } as ExtractedSlot, 19, 26)
    utterance.tagSlot({ name: 'group', source: 'us' } as ExtractedSlot, 37, 39)

    const labels = labelizeUtterance(utterance)

    expect(labels.length).toEqual(utterance.tokens.filter(t => !t.isSpace).length)
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
