import * as sdk from 'botpress/sdk'
import { Transition } from '..'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
  console.log('data from flow', data)
  return {
    transitions: createTransitions(),
    flow: {
      startNode: 'check-if-extracted',
      nodes: createNodes(data),
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = (): Transition[] => {
  return [
    { caption: 'On complete match', condition: 'temp.completeMatch == "true"', node: '' },
    { caption: 'On partial match', condition: 'temp.partialMatch == "true" && temp.completeMatch != "true"', node: '' },
    { caption: 'On failure', condition: 'temp.partialMatch != "true" && temp.completeMatch != "true"', node: '' }
  ]
}

const createNodes = data => {
  return [
    {
      name: 'check-if-extracted',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `basic-skills/intentMatch {"intentName":"${data.intentName}","intentSlots":"${data.intentSlots}"}`
        }
      ],
      onReceive: undefined,
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ]
    }
  ]
}

export default { generateFlow }
