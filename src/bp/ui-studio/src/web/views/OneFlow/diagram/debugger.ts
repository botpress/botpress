import sdk, { Condition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { sortTriggersByScore } from 'common/flow'
import { FlowView } from 'common/typings'
import _ from 'lodash'

export interface NodeDebugInfo {
  workflow: string
  node: string
  hasError?: boolean
  isEndOfFlow?: boolean
  nextWorkflow?: string
  prevWorkflow?: string
  triggers?: {
    result: { [condition: string]: number }
    /** Total score of all conditions */
    score: number
    /** Only if it's the trigger with the highest confidence in ndu.predictions */
    elected?: boolean
  }[]
  variable?: {
    output: string
    value: any
  }
  prompt?: {
    stage: string
  }
}

export interface FlowNode {
  flow: string
  node: string
}

export const prepareEventForDiagram = (event: sdk.IO.IncomingEvent, flows: FlowView[], conditions: Condition[]) => {
  let highlightedNodes: FlowNode[] = []
  let nodes: NodeDebugInfo[] = []
  let topQna: sdk.NDU.FaqTrigger

  if (!event) {
    return { nodeInfos: [], highlightedNodes }
  }

  const { session, context, __stacktrace } = event.state

  const getNode = (workflow: string, node: string): NodeDebugInfo => {
    workflow = workflow.replace('.flow.json', '')

    const existing = nodes.find(x => x.workflow === workflow && x.node === node)
    if (existing) {
      return existing
    }

    const newEntry = { workflow, node, triggers: [] }
    nodes = [...nodes, newEntry]
    return newEntry
  }

  try {
    highlightedNodes = processStackTrace(__stacktrace, context, getNode)
    topQna = processTriggers(event.ndu, conditions, getNode)

    processVariables(session, flows, getNode)
    processErrors(event, getNode)

    if (context) {
      const { activePrompt, currentFlow, currentNode } = context
      if (activePrompt && currentFlow) {
        getNode(currentFlow, currentNode).prompt = { stage: activePrompt.stage }
      }
    }
  } catch (err) {
    console.error(`Error processing event: ${err}`)
  }

  return { nodeInfos: nodes.filter(Boolean), highlightedNodes, topQna }
}

const processErrors = (event: sdk.IO.IncomingEvent, getNode: (flow: string, node: string) => NodeDebugInfo) => {
  if (!event.processing) {
    return
  }

  Object.values(event.processing)
    .filter(x => x.errors?.length)
    .forEach(({ errors }) => {
      errors.forEach(error => {
        console.log(error)
        if (error.flowName && error.nodeName) {
          getNode(error.flowName, error.nodeName).hasError = true
        }
      })
    })
}

const processVariables = (
  session: sdk.IO.CurrentSession,
  flows: FlowView[],
  getNode: (flow: string, node: string) => NodeDebugInfo
) => {
  if (!session?.workflows) {
    return
  }

  Object.keys(session.workflows).forEach(flowName => {
    const flowVars = session.workflows[flowName].variables
    const flowNodes = flows.find(x => x.name === `${flowName}.flow.json`)?.nodes

    if (flowVars && flowNodes) {
      Object.keys(flowVars).forEach(variable => {
        const node = flowNodes?.find(x => x.type === 'prompt' && x.prompt.params.output === variable)?.name

        getNode(flowName, node).variable = {
          output: variable,
          value: flowVars[variable].value
        }
      })
    }
  })
}

const processStackTrace = (
  traces: sdk.IO.JumpPoint[],
  context: sdk.IO.DialogContext,
  getNode: (flow: string, node: string) => NodeDebugInfo
) => {
  if (!traces?.length) {
    return
  }

  const lastNode = _.last(traces)
  if (lastNode) {
    getNode(lastNode.flow, lastNode.node).isEndOfFlow = _.isEmpty(context)
  }

  let currentFlow = _.first(traces).flow
  traces.forEach((trace, idx) => {
    if (trace.flow === currentFlow) {
      return
    }

    getNode(trace.flow, trace.node).prevWorkflow = currentFlow

    const previousTrace = traces[idx - 1]
    getNode(previousTrace.flow, previousTrace.node).nextWorkflow = trace.flow

    currentFlow = trace.flow
  })

  return traces.map(x => _.pick(x, ['flow', 'node']))
}

export const processTriggers = (
  ndu: sdk.NDU.DialogUnderstanding,
  conditions: Condition[],
  getNode: (flow: string, node: string) => NodeDebugInfo
): sdk.NDU.FaqTrigger | undefined => {
  if (!ndu?.triggers) {
    return
  }

  let topQna: sdk.NDU.FaqTrigger
  const topTriggerId = _.maxBy(_.toPairs(ndu.predictions), '1.confidence')?.[1]?.triggerId

  sortTriggersByScore(ndu.triggers).forEach(({ id, result, trigger, score }) => {
    const { type, workflowId, nodeId } = trigger
    if (type === 'node' || type === 'workflow') {
      const translatedKeys = _.mapKeys(result, (_, key) => lang.tr(conditions.find(x => x.id === key)?.label))
      getNode(workflowId, nodeId).triggers.push({ result: translatedKeys, score, elected: id === topTriggerId })
    } else if (type === 'faq' && id === topTriggerId) {
      topQna = trigger
    }
  })

  return topQna
}
