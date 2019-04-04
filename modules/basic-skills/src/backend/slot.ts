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
    { caption: 'On extracted', condition: 'temp.extracted == "true"', node: '' },
    { caption: 'On not found', condition: 'temp.notExtracted == "true"', node: '' },
    { caption: 'On already extracted', condition: 'temp.alreadyExtracted == "true"', node: '' }
  ]
}

const createNodes = data => {
  return [
    {
      name: 'slot-extract',
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
          name: `basic-skills/slotFill {"slotName":"${data.slotName}","entity":"${data.entity}"}`
        }
      ],
      next: [
        {
          condition: `session.${data.slotName}`,
          node: 'extracted'
        },
        {
          condition: 'true',
          node: 'not-extracted'
        }
      ]
    },
    {
      name: 'extracted',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"extracted","value":"true"}'
        }
      ],
      onReceive: undefined,
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ]
    },
    {
      name: 'not-extracted',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `basic-skills/slotNotFound {"retryAttempts":"${data.retryAttempts}"}`
        },
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.notFoundElement}`
        }
      ],
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `basic-skills/slotFill {"slotName":"${data.slotName}","entity":"${data.entity}"}`
        }
      ],
      next: [
        {
          condition: `session.${data.slotName}`,
          node: 'extracted'
        },
        {
          condition: `temp.notExtracted == "true"`,
          node: '#'
        },
        {
          condition: 'session.notFound > 0',
          node: 'not-extracted'
        },
        {
          condition: 'true',
          node: '#'
        }
      ]
    },
    {
      name: 'check-if-extracted',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `basic-skills/slotExtract {"entity":"${data.entity}"}`
        }
      ],
      onReceive: undefined,
      next: [
        {
          condition: `session.${data.slotName} !== undefined`,
          node: 'already-extracted'
        },
        {
          condition: 'true',
          node: 'slot-extract'
        }
      ]
    },
    {
      name: 'already-extracted',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'builtin/setVariable {"type":"temp","name":"alreadyExtracted","value":"true"}'
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
