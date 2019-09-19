import sdk from 'botpress/sdk'

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
          name: 'skill-email/send_email',
          args: data
        }
      ],
      next: [{ condition: 'true', node: '#' }]
    }
  ]
  return nodes
}

const createTransitions = (): Transition[] => {
  return [
    { caption: 'On success', condition: 'temp.success', node: '' },
    { caption: 'On failure', condition: '!temp.success', node: '' }
  ]
}

interface Transition {
  /**
   * The description of the skill transition
   */
  caption: string
  /**
   * The transition condition to evaluate
   */
  condition: string
  /**
   * The target node to transition to
   */
  node: string
}
