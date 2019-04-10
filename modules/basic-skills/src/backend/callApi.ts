import * as sdk from 'botpress/sdk'

import _ from 'lodash'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(data),
    flow: {
      nodes: createNodes(data),
      catchAll: {
        next: []
      }
    }
  }
}

const createNodes = data => {
  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `#!${data.contentId}`,
          args: { skill: 'choice' }
        }
      ],
      next: [{ condition: 'true', node: 'parse' }]
    }
  ]
  return nodes
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
