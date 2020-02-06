import assert from 'assert'
import { IO } from 'botpress/sdk'

import { FlowView, Goal } from './typings'

export const sortStoredEvents = (a: IO.StoredEvent, b: IO.StoredEvent) => {
  if (a.direction === 'incoming' && b.direction === 'outgoing') {
    return -1
  }
  if (a.direction === 'outgoing' && b.direction === 'incoming') {
    return 1
  }

  assert(a.direction === 'outgoing')
  assert(b.direction === 'outgoing')
  if (a.event.createdOn < b.event.createdOn) {
    return -1
  }
  if (a.event.createdOn > b.event.createdOn) {
    return 1
  }
  return 0
}

const flowNameToGoal = (flowName: string): Goal => {
  const [t, name] = flowName.split('/')
  return { id: flowName.replace('.flow.json', ''), topic: t, name: name.replace('.flow.json', '') }
}

export const flowsToGoals = (flows: FlowView[]): Goal[] => {
  return flows.reduce((result, flow) => {
    if (!flow.name.startsWith('Built-In/') && !flow.name.startsWith('skills/')) {
      result.push(flowNameToGoal(flow.name))
    }
    return result
  }, [])
}

export const getGoalFromEvent = (event: IO.IncomingEvent): Goal => {
  if (!event.ndu) {
    throw 'No Goal found'
  }

  const trigger = Object.values(event.ndu.triggers).find(trigger => {
    return trigger.result.user_intent_is === 1
  })

  if (!trigger) {
    throw 'No Goal found'
  }

  return flowNameToGoal(trigger.goal)
}
