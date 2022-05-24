import * as sdk from 'botpress/sdk'
import { ExitTypes, SkillData } from 'src/types'

const makeExit = (exitType: ExitTypes) => `temp['hitlnext-${exitType}'] === true`

const generateFlow = async (data: SkillData): Promise<sdk.FlowGenerationResult> => {
  const nodes: sdk.SkillFlowNode[] = []

  if (data.redirectNoAgent) {
    nodes.push({
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'hitlnext/check_agents',
          args: data
        }
      ],
      next: [
        { condition: makeExit('noAgent'), node: '#' },
        { condition: 'true', node: 'hitl' }
      ]
    })
  }

  nodes.push(
    {
      name: 'hitl',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'hitlnext/handoff',
          args: data
        }
      ],
      next: [{ condition: 'true', node: 'wait' }]
    },
    {
      name: 'wait',
      onEnter: [],
      onReceive: [],
      next: [
        { condition: makeExit('noAgent'), node: '#' },
        { condition: makeExit('timedOutWaitingAgent'), node: '#' },
        { condition: makeExit('handoffResolved'), node: '#' },
        { condition: 'true', node: 'wait' }
      ]
    }
  )

  return {
    transitions: createTransitions(data),
    flow: {
      nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = (data: SkillData) => {
  const transitions: sdk.NodeTransition[] = [
    { caption: 'Handoff Resolved', condition: makeExit('handoffResolved'), node: '' }
  ]

  if (data.redirectNoAgent) {
    transitions.push({ caption: 'No Agent Available', condition: makeExit('noAgent'), node: '' })
  }

  if (data.timeoutDelay > 0) {
    transitions.push({ caption: 'Timed Out Waiting Agent', condition: makeExit('timedOutWaitingAgent'), node: '' })
  }

  return transitions
}

export default { generateFlow }
