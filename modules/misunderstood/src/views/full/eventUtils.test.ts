import { groupEventsByUtterance } from './eventUtils'

describe('groupEventsByUtterance', () => {
  it('groups zero events', () => {
    const result = groupEventsByUtterance([])

    expect(result).toEqual(new Map())
  })

  it('groups one event', () => {
    const event = { preview: 'utt1' }
    const result = groupEventsByUtterance([event])

    expect(result).toEqual(new Map([['utt1', [{ event: event, eventIndex: 0 }]]]))
  })

  it('groups many events with same utterance', () => {
    const event1 = { preview: 'utt1' }
    const event2 = { preview: 'utt1' }
    const event3 = { preview: 'utt1' }

    const result = groupEventsByUtterance([event1, event2, event3])

    expect(result).toEqual(
      new Map([
        [
          'utt1',
          [
            { event: event1, eventIndex: 0 },
            { event: event2, eventIndex: 1 },
            { event: event3, eventIndex: 2 }
          ]
        ]
      ])
    )
  })

  it('groups many events with different utterances', () => {
    const event1 = { preview: 'utt1' }
    const event2 = { preview: 'utt2' }
    const event3 = { preview: 'utt3' }

    const result = groupEventsByUtterance([event1, event2, event3])

    expect(result).toEqual(
      new Map([
        ['utt1', [{ event: event1, eventIndex: 0 }]],
        ['utt2', [{ event: event2, eventIndex: 1 }]],
        ['utt3', [{ event: event3, eventIndex: 2 }]]
      ])
    )
  })

  it('groups many events with repeated utterances', () => {
    const event1 = { preview: 'utt1' }
    const event2 = { preview: 'utt2' }
    const event3 = { preview: 'utt3' }
    const event4 = { preview: 'utt2' }
    const event5 = { preview: 'utt1' }

    const result = groupEventsByUtterance([event1, event2, event3, event4, event5])

    expect(result).toEqual(
      new Map([
        [
          'utt1',
          [
            { event: event1, eventIndex: 0 },
            { event: event5, eventIndex: 4 }
          ]
        ],
        [
          'utt2',
          [
            { event: event2, eventIndex: 1 },
            { event: event4, eventIndex: 3 }
          ]
        ],
        ['utt3', [{ event: event3, eventIndex: 2 }]]
      ])
    )
  })
})
