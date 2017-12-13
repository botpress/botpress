import _ from 'lodash'

exports.validateFlowSchema = flow => {
  const errorPrefix = `[Flow] Error loading "${flow.location}"`

  if (!flow || !_.isObjectLike(flow)) {
    return errorPrefix + ', invalid JSON flow schema'
  }

  if (!flow.version || !_.isString(flow.version)) {
    return errorPrefix + ', expected valid version but found none'
  }

  if (!flow.version.startsWith('0.')) {
    return errorPrefix + ', unsupported `version` of the schema "' + flow.version + '"'
  }

  if (!_.isString(flow.startNode)) {
    return errorPrefix + ', expected valid `startNode`'
  }

  if (!_.isArray(flow.nodes)) {
    return errorPrefix + ', expected `nodes` to be an array of nodes'
  }

  if (!_.find(flow.nodes, { name: flow.startNode })) {
    return errorPrefix + ', expected `startNode` to point to an existing flow node'
  }

  if (flow.catchAll) {
    if (flow.catchAll.onEnter) {
      return errorPrefix + ', catchAll does not support "onEnter"'
    }

    if (flow.catchAll.onReceive) {
      if (_.isString(flow.catchAll.onReceive)) {
        flow.catchAll.onReceive = [flow.catchAll.onReceive]
      }
    }

    if (flow.catchAll.next) {
      if (_.isString(flow.catchAll.next)) {
        flow.catchAll.next = [flow.catchAll.next]
      }
    }
  }

  const errs =
    flow.nodes &&
    flow.nodes.map(node => {
      // TODO Better node validation

      // TODO Validate that connections are valid
      // TODO Validate that conditions are valid

      if (!_.isString(node.id) || node.id.length <= 3) {
        return errorPrefix + ', expected all nodes to have a valid id'
      }

      if (_.isString(node.onEnter)) {
        node.onEnter = [node.onEnter]
      }

      if (_.isString(node.onReceive)) {
        node.onReceive = [node.onReceive]
      }

      if (_.isString(node.next)) {
        node.next = [node.next]
      }
    })

  return _.first(errs, e => !!e)
}
