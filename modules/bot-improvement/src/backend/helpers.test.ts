import { IO } from 'botpress/sdk'
import _ from 'lodash'

import { flowsToGoals, getGoalFromEvent, sortStoredEvents } from './helpers'
import { FlowView } from './typings'

describe('sortStoredEvents', () => {
  const buildEvent = (): IO.StoredEvent => {
    return {
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
    }
  }

  test('empty', () => {
    expect([].sort(sortStoredEvents)).toEqual([])
  })

  test('1 stored event', () => {
    const e = buildEvent()

    expect([e].sort(sortStoredEvents)).toEqual([e])
  })

  test('2 events', () => {
    const e1 = buildEvent()
    const e2 = _.merge(buildEvent(), { direction: 'outgoing' })

    expect([e1, e2].sort(sortStoredEvents)).toEqual([e1, e2])
    expect([e2, e1].sort(sortStoredEvents)).toEqual([e1, e2])
  })

  test('3 events', () => {
    const e1 = _.merge(buildEvent(), { direction: 'outgoing', event: { createdOn: new Date('2019-01-01') } })
    const e2 = _.merge(buildEvent(), { direction: 'outgoing', event: { createdOn: new Date('2019-01-02') } })
    const e3 = _.merge(buildEvent(), { direction: 'outgoing', event: { createdOn: new Date('2019-01-03') } })

    expect([e1, e2, e3].sort(sortStoredEvents)).toEqual([e1, e2, e3])
    expect([e3, e2, e1].sort(sortStoredEvents)).toEqual([e1, e2, e3])
    expect([e2, e3, e1].sort(sortStoredEvents)).toEqual([e1, e2, e3])
  })
})

describe('flowsToGoals', () => {
  test('no flows', () => {
    expect(flowsToGoals([])).toEqual([])
  })

  test('many flows', () => {
    const flows: FlowView[] = [
      { name: 'Built-In/error.flow.json', startNode: 'someStartNode', nodes: [], links: [] },
      { name: 'Built-In/feedback.flow.json', startNode: 'someStartNode', nodes: [], links: [] },
      { name: 'Built-In/welcome.flow.json', startNode: 'someStartNode', nodes: [], links: [] },
      { name: 'HR/hireEmployee.flow.json', startNode: 'someStartNode', nodes: [], links: [] },
      { name: 'IT/startServer.flow.json', startNode: 'someStartNode', nodes: [], links: [] },
      { name: 'skills/choiceb71567.flow.json', startNode: 'someStartNode', nodes: [], links: [] }
    ]

    expect(flowsToGoals(flows)).toEqual([
      { id: 'HR/hireEmployee', topic: 'HR', name: 'hireEmployee' },
      { id: 'IT/startServer', topic: 'IT', name: 'startServer' }
    ])
  })
})

describe('getGoalFromEvent', () => {
  const buildEvent = (): IO.IncomingEvent => {
    return {
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
      setFlag: (flag, value) => {},
      state: {
        user: {},
        temp: {},
        bot: {},
        session: { lastMessages: [], lastGoals: [] },
        context: {},
        __stacktrace: []
      }
    }
  }

  test('no goals', () => {
    const event = buildEvent()
    try {
      getGoalFromEvent(event)
    } catch (e) {
      expect(e).toBe('No Goal found')
    }
  })

  test('one goal', () => {
    const event = _.merge(buildEvent(), {
      ndu: {
        triggers: { sometriggerId: { goal: 'HR/hireEmployee.flow.json', result: { user_intent_is: 1 } } },
        actions: []
      }
    })

    expect(getGoalFromEvent(event)).toEqual({ id: 'HR/hireEmployee', topic: 'HR', name: 'hireEmployee' })
  })
})
