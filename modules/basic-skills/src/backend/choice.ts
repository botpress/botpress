import * as sdk from 'botpress/sdk'

import _ from 'lodash'

const generateFlow = (data): sdk.FlowGenerationResult => {
  const invalidTextData: any = {}
  if (data.config.invalidText && data.config.invalidText.length) {
    invalidTextData.text = data.config.invalidText
  }

  const maxAttempts = data.config.nbMaxRetries

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
      next: [{ condition: 'true', node: 'parse' }]
    },
    {
      name: 'parse',
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'skill-choice/parse_answer',
          args: data
        }
      ],
      next: [{ condition: `state['skill-choice-valid'] === true`, node: '#' }, { condition: 'true', node: 'invalid' }]
    },
    {
      name: 'invalid',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'skill-choice/invalid_answer'
        }
      ],
      next: [
        { condition: `state['skill-choice-invalid-count'] <= "3"`, node: 'sorry' },
        { condition: 'true', node: '#' }
      ]
    },
    {
      name: 'sorry',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentId}`,
          args: { ...invalidTextData, skill: 'choice' }
        }
      ],
      next: [{ condition: 'true', node: 'parse' }]
    }
  ]

  return {
    transitions: createTransitions(data),
    flow: {
      nodes: nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = data => {
  const transitions: sdk.NodeTransition[] = Object.keys(data.keywords).map(choice => {
    const choiceShort = choice.length > 8 ? choice.substr(0, 7) + '...' : choice

    return {
      caption: `User picked [${choiceShort}]`,
      condition: `state['skill-choice-ret'] == "${choice}"`,
      node: 'entry'
    }
  })

  transitions.push({
    caption: 'On failure',
    condition: 'true',
    node: 'entry'
  })

  return transitions
}

export default { generateFlow }
