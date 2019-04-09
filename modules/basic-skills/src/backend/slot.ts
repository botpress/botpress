import * as sdk from 'botpress/sdk'
import { Transition } from '..'
import axios from 'axios'

const setup = async (bp: typeof sdk) => {
  const router = bp.http.createRouterForBot('basic-skills')
  router.put('/skill/slot', async (req, res) => {
    const { intent } = req.body
    const { botId } = req.params

    await updateSkillContexts(bp, botId, intent)
  })
}

/**
 * Update the contexts of the slot skill when the contexts of an intent has changed.
 */
const updateSkillContexts = async (bp, botId, intent) => {
  const axiosConfig = await bp.http.getAxiosConfigForBot(botId)
  const { data: updatedIntent } = await axios.get(`/mod/nlu/intents/${intent}`, axiosConfig)

  // Get the skills flows
  const filesPaths = await bp.ghost.forBot(botId).directoryListing('/flows/skills', '*.flow.json')
  const slotsFilesPaths = filesPaths.filter(x => x.startsWith('slot'))

  // Find slot skills that use the intent and update its contexts
  for (const filePath of slotsFilesPaths) {
    const flow = await bp.ghost.forBot(botId).readFileAsObject('/flows/skills', filePath)
    if (flow.skillData.intent !== intent) {
      return
    }

    if (flow.skillData.contexts !== updatedIntent.contexts) {
      flow.skillData.contexts = updatedIntent.contexts
      await bp.ghost.forBot(botId).upsertFile('/flows/skills', filePath, JSON.stringify(flow, undefined, 2))
    }
  }
}

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
      name: `basic-skills/slot_fill {"slotName":"${data.slotName}","entity":"${data.entity}"}`
    }
  ]

  if (data.validationAction) {
    slotExtractOnReceive.push({
      type: sdk.NodeActionType.RunAction,
      name: `${data.validationAction.value.label} {}`
    })
  }

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
      onReceive: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `basic-skills/slot_fill {"slotName":"${data.slotName}","entity":"${data.entity}"}`
        }
      ],
      next: [
        {
          condition: `session.extractedSlots.${data.slotName}`,
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
      onEnter: undefined,
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

export default { generateFlow, setup }
