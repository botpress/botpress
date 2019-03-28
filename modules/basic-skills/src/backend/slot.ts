import * as sdk from 'botpress/sdk'
import { Transition } from '..'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
  console.log('data', data, metadata)

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
    { caption: 'Extracted', condition: 'temp.extracted == "true"', node: '' },
    { caption: 'Slot not found', condition: 'temp.notExtracted == "true"', node: '' },
    { caption: 'Already exists', condition: 'temp.alreadyExtracted == "true"', node: '' }
  ]
}

const createNodes = data => {
  const sessionSlotVariable = {
    type: 'session',
    name: data.slotName,
    value: `{{event.nlu.slots.${data.slotName}.value}}`
  }

  return [
    {
      name: 'slot-extract',
      next: [
        {
          condition: `event.nlu.slots.${data.slotName}`,
          node: 'extracted'
        },
        {
          condition: 'true',
          node: 'not-extracted'
        }
      ],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `builtin/appendContext {"contexts":"${data.contexts.join(',')}","ttl":"10"}`
        },
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentElement}`
        }
      ],
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `builtin/setVariable ${JSON.stringify(sessionSlotVariable)}`
        }
      ]
    },
    {
      name: 'extracted',
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"extracted","value":"true"}'
        }
      ],
      onReceive: []
    },
    {
      name: 'not-extracted',
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"notExtracted","value":"true"}'
        }
      ],
      onReceive: []
    },
    {
      name: 'check-if-extracted',
      next: [
        {
          condition: `session.${data.slotName} !== undefined`,
          node: 'already-extracted'
        },
        {
          condition: 'true',
          node: 'slot-extract'
        }
      ],
      onEnter: [],
      onReceive: []
    },
    {
      name: 'already-extracted',
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"alreadyExtracted","value":"true"}'
        }
      ],
      onReceive: []
    }
  ]
}

export default { generateFlow }
