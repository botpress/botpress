import { IO } from 'botpress/sdk'

import { FlowView, Goal } from './typings'

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
