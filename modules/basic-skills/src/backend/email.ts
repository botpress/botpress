import * as sdk from 'botpress/sdk'

export const generateFlow = async (
  data: any,
  metadata: sdk.FlowGeneratorMetadata
): Promise<sdk.FlowGenerationResult> => {
  return {
    transitions: createTransitions(),
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
          name: 'basic-skills/send_email',
          args: data
        }
      ],
      next: [{ condition: 'true', node: '#' }]
    }
  ]
  return nodes
}

const createTransitions = (): sdk.NodeTransition[] => {
  return [
    { caption: 'On success', condition: 'temp.success', node: '' },
    { caption: 'On failure', condition: '!temp.success', node: '' }
  ]
}

export default { generateFlow }
