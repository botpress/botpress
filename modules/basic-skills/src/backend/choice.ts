import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import yn from 'yn'

import { generateFlowLegacy } from './choice_legacy'

export const MAX_LABEL_LENGTH = 8

export interface ChoiceData {
  contentId: string
  invalidContentId: string
  keywords: any
  config: ChoiceConfig
  randomId?: string
}

export interface ChoiceConfig {
  nbMaxRetries: number
  repeatChoicesOnInvalid: boolean
  contentElement: string
  variableName: string
}

const setup = async bp => {
  const router = bp.http.createRouterForBot('basic-skills')

  router.get('/choice/config', async (req, res) => {
    const config = await bp.config.getModuleConfigForBot('basic-skills', req.params.botId)
    res.send(_.pick(config, ['defaultContentElement', 'defaultContentRenderer', 'defaultMaxAttempts', 'matchNumbers']))
  })

  const config = await bp.config.getModuleConfig('basic-skills')

  const checkCategoryAvailable = async () => {
    const categories = await bp.cms.getAllContentTypes().map(c => c.id)

    if (!categories.includes(config.defaultContentElement)) {
      bp.logger.warn(`Configured to use Content Element "${config.defaultContentElement}", but it was not found.`)

      if (config.defaultContentElement === 'builtin_single-choice') {
        bp.logger.warn(`You should probably install (and use) the @botpress/builtins
  module OR change the "defaultContentElement" in this module's configuration to use your own content element.`)
      }

      return
    }
  }

  if (!config.disableIntegrityCheck) {
    setTimeout(checkCategoryAvailable, 3000)
  }
}

const generateFlow = async (
  data: ChoiceData,
  metadata: sdk.FlowGeneratorMetadata
): Promise<sdk.FlowGenerationResult> => {
  const { variableName } = data.config
  const randomId = variableName && variableName.length ? variableName : data.randomId
  const keySuffix = randomId ? `-${randomId}` : ''

  const hardRetryLimit = 10
  const nbMaxRetries = Math.min(Number(data.config.nbMaxRetries), hardRetryLimit)
  const repeatQuestion = yn(data.config.repeatChoicesOnInvalid)

  if (!metadata.isOneFlow) {
    return generateFlowLegacy(data)
  }

  const sorrySteps = []

  if (data.invalidContentId && data.invalidContentId.length >= 3) {
    sorrySteps.push({
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.invalidContentId}`
    })
  }

  if (repeatQuestion) {
    sorrySteps.push({
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.contentId}`,
      args: { skill: 'choice' }
    })
  }

  const nodes: sdk.SkillFlowNode[] = [
    {
      name: 'entry',
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: `builtin/setVariable {"type":"temp","name":"skill-choice-invalid-count${keySuffix}","value": 0 }`
        },
        {
          type: sdk.NodeActionType.RenderElement,
          name: `#!${data.contentId}`,
          args: { skill: 'choice' }
        }
      ],
      onReceive: [],
      next: [{ condition: 'true', node: 'wait' }]
    },
    /**
     * We tell the dialog engine to stay on this node, since triggers will always score higher and will send the user on the correct node
     * The onReceive ensures it doesn't go into an infinite loop
     */
    {
      name: 'wait',
      onReceive: [],
      next: [{ condition: 'true', node: 'wait' }]
    },
    {
      name: 'failure',
      type: 'trigger',
      conditions: [{ id: 'custom_confidence', params: { confidence: '0.3' } }],
      onEnter: [
        {
          type: sdk.NodeActionType.RunAction,
          name: 'basic-skills/choice_invalid_answer',
          args: { randomId }
        },
        ...sorrySteps
      ],
      onReceive: [],
      next: [
        {
          condition: `Number(temp['skill-choice-invalid-count-${randomId}']) > Number(${nbMaxRetries})`,
          node: '#'
        },
        {
          condition: 'true',
          node: 'failure'
        }
      ],
      activeWorkflow: true
    }
  ]

  Object.keys(data.keywords).forEach((choice, idx) => {
    const index = idx + 1
    const successNodeId = `success-${index}`

    const addNode = (type: string, condition: any) => {
      nodes.push({
        name: `trigger-${index}-${type}`,
        type: 'trigger',
        activeWorkflow: true,
        onEnter: [],
        next: [
          {
            condition: 'true',
            node: successNodeId
          }
        ],
        conditions: [condition]
      })
    }

    addNode('entity', {
      id: 'extracted_entity',
      params: { type: 'system.number', comparison: 'equal', expectedValue: index }
    })

    if (choice.startsWith('intent:')) {
      addNode('intent', { id: 'user_intent_is', params: { intentName: data.keywords[choice].replace('intent:', '') } })
    } else {
      addNode('text', { id: 'type_text', params: { candidate: data.keywords[choice], exactMatch: false } })
    }

    nodes.push({
      name: successNodeId,
      type: 'success',
      next: [
        {
          condition: 'true',
          node: '#'
        }
      ]
    })
  })

  return {
    transitions: createTransitions(data),
    flow: {
      nodes,
      catchAll: {
        next: []
      }
    }
  }
}

const createTransitions = (data: ChoiceData) => {
  const transitions: sdk.NodeTransition[] = Object.keys(data.keywords).map((choice, idx) => {
    const choiceShort = choice.length > MAX_LABEL_LENGTH ? choice.substr(0, MAX_LABEL_LENGTH - 1) + '...' : choice

    return {
      caption: `User picked [${choiceShort}]`,
      condition: `lastNode=success-${idx + 1}`,
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

export default { generateFlow, setup }
