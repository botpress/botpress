import * as sdk from 'botpress/sdk'

import { Transition } from './typings'

const generateFlow = async (data: any, metadata: sdk.FlowGeneratorMetadata): Promise<sdk.FlowGenerationResult> => {
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
  const slotExtractOnReceive = [
    {
      type: sdk.NodeActionType.RunAction,
      name: `basic-skills/slot_fill {"slotName":"${data.slotName}","entities":"${data.entities}"}`
    }
  ]

  if (data.validationAction) {
    slotExtractOnReceive.push({
      type: sdk.NodeActionType.RunAction,
      name: `${data.validationAction} {}`
    })
  }

  return [
    {
      name: 'slot-extract',
      onEnter: [
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentElement}`
        }
      ],
      onReceive: slotExtractOnReceive,
      next: [
        {
          condition: `session.extractedSlots.${data.slotName} && (temp.valid === undefined || temp.valid == "true")`,
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
          name: `basic-skills/slot_not_found {"retryAttempts":"${data.retryAttempts}"}`
        },
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.notFoundElement}`
        }
      ],
      onReceive: slotExtractOnReceive,
      next: [
        {
          condition: `session.extractedSlots.${data.slotName} && (temp.valid === undefined || temp.valid == "true")`,
          node: 'extracted'
        },
        {
          condition: `temp.notExtracted == "true"`,
          node: '#'
        },
        {
          condition: 'session.extractedSlots.notFound > 0',
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
          name: `basic-skills/slot_update_contexts {"intentName":"${data.intent}"}`
        }
      ],
      onReceive: undefined,
      next: [
        {
          condition: `session.extractedSlots.${data.slotName} !== undefined`,
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
