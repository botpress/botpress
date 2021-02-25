import sdk from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'

export interface NodeDebugInfo {
  workflow: string
  node: string
  hasError?: boolean
  isEndOfFlow?: boolean
  nextWorkflow?: string
  prevWorkflow?: string
}

export interface FlowNode {
  flow: string
  node: string
}

export const prepareEventForDiagram = (event: sdk.IO.IncomingEvent, flows: FlowView[]) => {
  let highlightedNodes: FlowNode[] = []
  let nodes: NodeDebugInfo[] = []

  if (!event) {
    return { nodeInfos: [], highlightedNodes }
  }

  const { context, __stacktrace } = event.state

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
    processErrors(event, getNode)
  } catch (err) {
    console.error(`Error processing event: ${err}`)
  }

  return { nodeInfos: nodes.filter(Boolean), highlightedNodes }
}

const processErrors = (event: sdk.IO.IncomingEvent, getNode: (flow: string, node: string) => NodeDebugInfo) => {
  if (!event.processing) {
    return
  }

  Object.values(event.processing)
    .filter(x => x.errors?.length)
    .forEach(({ errors }) => {
      errors.forEach(error => {
        console.error(error)
        if (error.flowName && error.nodeName) {
          getNode(error.flowName, error.nodeName).hasError = true
        }
      })
    })
}

const processStackTrace = (
  traces: sdk.IO.JumpPoint[],
  context: sdk.IO.DialogContext,
  getNode: (flow: string, node: string) => NodeDebugInfo
): FlowNode[] => {
  if (!traces?.length) {
    return []
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
