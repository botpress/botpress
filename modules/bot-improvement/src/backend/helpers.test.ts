import assert from 'assert'
import { IO } from 'botpress/sdk'
import _ from 'lodash'

import { sortStoredEvents, topicsToGoals } from './helpers'

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>
}

const buildEvent = (props?: RecursivePartial<IO.StoredEvent>): IO.StoredEvent => {
  return _.merge(
    {
      id: 1,
      direction: 'incoming',
      sessionId: 'some session id',
      event: {
        channel: 'web',
        target: 'abcd',
        botId: 'myBot',
        id: 'eventId',
        direction: 'incoming',
        type: 'text',
        payload: {},
        preview: 'my event preview',
        createdOn: new Date(),
        hasFlag: flag => true,
        setFlag: (flag, value) => {}
      },
      createdOn: '2019-10-23',
      channel: 'web',
      target: 'abcd',
      botId: 'myBot'
    },
    props
  )
}

describe('sortStoredEvents', () => {
  test('empty', () => {
    expect([].sort(sortStoredEvents)).toEqual([])
  })

  test('1 stored event', () => {
    const e = buildEvent()

    expect([e].sort(sortStoredEvents)).toEqual([e])
  })

  test('2 events', () => {
    const e1 = buildEvent()

    const e2 = buildEvent({ direction: 'outgoing' })

    expect([e1, e2].sort(sortStoredEvents)).toEqual([e1, e2])
    expect([e2, e1].sort(sortStoredEvents)).toEqual([e1, e2])
  })

  test('3 events', () => {
    const e1 = buildEvent()

    const e2 = buildEvent({ direction: 'outgoing', event: { createdOn: new Date('2019-01-01') } })
    const e3 = buildEvent({ direction: 'outgoing', event: { createdOn: new Date('2019-01-02') } })

    expect([e1, e2, e3].sort(sortStoredEvents)).toEqual([e1, e2, e3])
    expect([e3, e2, e1].sort(sortStoredEvents)).toEqual([e1, e2, e3])
    expect([e2, e3, e1].sort(sortStoredEvents)).toEqual([e1, e2, e3])
  })
})

describe('topicsToGoals', () => {
  test('no topics', () => {
    expect(topicsToGoals([])).toEqual([])
  })

  test('one topic', () => {
    expect(topicsToGoals([{ name: 'HR/fireEmployee', description: '' }])).toEqual([
      { topic: 'HR', name: 'fireEmployee' }
    ])
  })

  test('topics without goal names', () => {
    expect(
      topicsToGoals([
        { name: 'HR/fireEmployee', description: '' },
        { name: 'HR/', description: '' },
        { name: 'IT/', description: '' }
      ])
    ).toEqual([{ topic: 'HR', name: 'fireEmployee' }])
  })
})
