import * as sdk from 'botpress/sdk'

import _ from 'lodash'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
  let onInvalidText = undefined
  if (data.config.invalidText && data.config.invalidText.length) {
    onInvalidText = data.config.invalidText
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
          name: 'basic-skills/choice_parse_answer',
          args: data
        }
      ],
      next: [{ condition: `temp['skill-choice-valid'] === true`, node: '#' }, { condition: 'true', node: 'invalid' }]
    },
    {
      name: 'invalid',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'basic-skills/choice_invalid_answer'
        }
      ],
      next: [
        {
          condition: `temp['skill-choice-invalid-count'] <= ${maxAttempts}`,
          node: 'sorry'
        },
        { condition: 'true', node: '#' }
      ]
    },
    {
      name: 'sorry',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentId}`,
          args: { ...{ skill: 'choice' }, ...(onInvalidText ? { text: onInvalidText } : {}) }
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
      condition: `temp['skill-choice-ret'] == "${choice}"`,
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

export default { generateFlow }
