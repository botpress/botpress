import { IO } from 'botpress/sdk'

import { FlowView, Goal } from './typings'

const flowNameToGoal = (flowName: string): Goal => {
  const { topic, workflow } = parseFlowName(flowName)
  return { id: flowName.replace('.flow.json', ''), topic, name: workflow }
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

export const parseFlowName = (flowName: string, includeFolders?: boolean) => {
  const chunks = flowName.replace(/\.flow\.json$/i, '').split('/')

  if (chunks.length === 1) {
    return { workflow: chunks[0] }
  } else if (chunks.length === 2) {
    return { topic: chunks[0], workflow: chunks[1] }
  } else {
    return {
      topic: chunks[0],
      workflow: includeFolders ? chunks.slice(1).join('/') : chunks[chunks.length - 1],
      folders: chunks.slice(1, chunks.length - 1)
    }
  }
}
