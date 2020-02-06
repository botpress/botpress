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
  if (event.state.session.lastGoals.length === 0) {
    throw 'No Goal found'
  }

  const goal = event.state.session.lastGoals.find(goal => goal.active)

  if (!goal) {
    throw 'No Goal found'
  }

  return flowNameToGoal(goal.goal)
}
