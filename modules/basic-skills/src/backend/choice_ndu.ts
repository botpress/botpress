import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

const generateFlowNdu = async (data: any): Promise<sdk.FlowGenerationResult> => {
  const { randomId } = data

  const hardRetryLimit = 10
  const nbMaxRetries = Math.min(Number(data.config.nbMaxRetries), hardRetryLimit)
  const repeatQuestion = yn(data.config.repeatChoicesOnInvalid)

  const sorrySteps = []

  if (data.invalidContentId && data.invalidContentId.length >= 3) {
    sorrySteps.push({
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.invalidContentId}`
    })
  }

  if (repeatQuestion) {
    sorrySteps.push({
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.contentId}`,
      args: { skill: 'choice' }
    })
  }

  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentId}`,
          args: { skill: 'choice' }
        }
      ],
      onReceive: [],
      next: [{ condition: 'true', node: 'wait' }]
    },
    {
      name: 'wait',
      onReceive: [],
      next: [{ condition: 'true', node: 'wait' }]
    },
    {
      name: 'failure',
      type: 'trigger',
      conditions: [{ id: 'custom_confidence', params: { confidence: '0.3' } }],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'basic-skills/choice_invalid_answer',
          args: { randomId }
        },
        ...sorrySteps
      ],
      onReceive: [],
      next: [
        {
          condition: `Number(temp['skill-choice-invalid-count-${randomId}']) > Number(${nbMaxRetries})`,
          node: '#'
        },
        {
          condition: 'true',
          node: 'failure'
        }
      ],
      activeWorkflow: true
    }
  ]

  Object.keys(data.keywords).forEach((choice, idx) => {
    const index = idx + 1
    const successNodeId = `success-${index}`

    const addNode = (type: string, condition: any) => {
      nodes.push({
        name: `trigger-${index}-${type}`,
        type: 'trigger',
        activeWorkflow: true,
        onEnter: [],
        next: [
          {
            condition: 'true',
            node: successNodeId
          }
        ],
        conditions: [condition]
      })
    }

    addNode('entity', {
      id: 'extracted_entity',
      params: { type: 'system.number', comparison: 'equal', expectedValue: index }
    })

    if (choice.startsWith('intent:')) {
      addNode('intent', { id: 'user_intent_is', params: { intentName: data.keywords[choice].replace('intent:', '') } })
    } else {
      addNode('text', { id: 'type_text', params: { candidate: data.keywords[choice], exactMatch: false } })
    }

    nodes.push({
      name: successNodeId,
      type: 'success',
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ]
    })
  })

  return {
    transitions: createTransitions(data, randomId),
    flow: {
      nodes: nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = (data, randomId) => {
  const transitions: sdk.NodeTransition[] = Object.keys(data.keywords).map((choice, idx) => {
    const choiceShort = choice.length > 8 ? choice.substr(0, 7) + '...' : choice

    return {
      caption: `User picked [${choiceShort}]`,
      condition: `lastNode=success-${idx + 1}`,
      node: ''
    }
  })

  transitions.push({
    caption: 'On failure',
    condition: 'true',
    node: ''
  })

  return transitions
}

export { generateFlowNdu }
