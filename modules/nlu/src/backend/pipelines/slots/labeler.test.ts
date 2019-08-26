import { Sequence, Token } from '../../typings'

import { labelizeUtterance } from './labeler'

const AN_UTTERANCE: Sequence = {
  cannonical: 'Careful my friend, Alex W. is one of us',
  intent: 'warn',
  tokens: [
    { tag: 'o', cannonical: 'careful', matchedEntities: [] },
    { tag: 'B', cannonical: 'my', slot: 'listener', matchedEntities: ['friend'] },
    { tag: 'I', cannonical: 'friend', slot: 'listener', matchedEntities: ['friend'] },
    { tag: 'o', cannonical: ',' }, // no matched entities is on purpose here
    { tag: 'B', cannonical: 'Alex', slot: 'person', matchedEntities: [] },
    { tag: 'I', cannonical: 'W.', slot: 'person', matchedEntities: [] },
    { tag: 'o', cannonical: 'is' },
    { tag: 'o', cannonical: 'one' },
    { tag: 'o', cannonical: 'of' },
    { tag: 'B', cannonical: 'us', slot: 'group' }
  ] as Token[]
}

test('labelizeUtterance', () => {
  const labels = labelizeUtterance(AN_UTTERANCE)
  expect(labels.length).toEqual(AN_UTTERANCE.tokens.length)
  Array.from([0, 3, 6, 7, 8]).forEach(i => {
    expect(labels[i]).toEqual('o')
  })
  expect(labels[1]).toEqual('B-listener')
  expect(labels[2]).toEqual('I-listener')
  expect(labels[4]).toEqual('B-person/any')
  expect(labels[5]).toEqual('I-person/any')
  expect(labels[9]).toEqual('B-group/any')
})
