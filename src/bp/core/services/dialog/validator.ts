import { Flow } from 'botpress/sdk'
import _ from 'lodash'

export function validateFlowSchema(flow: Flow, isOneFlow: boolean) {
  // const errorPrefix = `[Flow] Invalid flow "${flow && flow.location}"`
  const errorPrefix = `[Flow] Invalid flow "${flow}"`

  if (!flow || !_.isObjectLike(flow)) {
    return 'Invalid JSON flow schema'
  }

  if (!flow.version || !_.isString(flow.version)) {
    return `${errorPrefix}, expected valid version but found none`
  }

  if (!flow.version.startsWith('0.')) {
    return `${errorPrefix}, unsupported version of the schema "${flow.version}"`
  }

  if (!isOneFlow && !_.isString(flow.startNode)) {
    return `${errorPrefix}, expected valid 'startNode'`
  }

  if (!_.isArray(flow.nodes)) {
    return `${errorPrefix}, expected 'nodes' to be an array of nodes`
  }

  // This rule is no longer valid when using oneflow, since we have no start node
  if (!isOneFlow && !_.find(flow.nodes, { name: flow.startNode })) {
    return `${errorPrefix}, expected 'startNode' to point to a valid node name`
  }

  if (flow.catchAll && flow.catchAll.onEnter) {
    return `${errorPrefix}, "catchAll" does not support "onEnter"`
  }

  for (const node of flow.nodes) {
    if (!_.isString(node.id) || node.id.length <= 3) {
      return `${errorPrefix}, expected node ${node.id} (${node.name}) to have a valid id`
    }
  }
}
