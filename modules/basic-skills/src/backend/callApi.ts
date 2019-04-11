import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Transition } from './typings'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
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
          name: `basic-skills/call_api {"url":"${data.url}","method":"${data.method}","body":"${data.body}"}`
        }
      ]
    }
  ]
  return nodes
}

const createTransitions = (): Transition[] => {
  return [
    { caption: 'On success', condition: 'temp.apiCallResponse', node: '' },
    { caption: 'On failure', condition: '!temp.apiCallResponse', node: '' }
  ]
}

export default { generateFlow }
