import _ from 'lodash'
import Promise from 'bluebird'

const loggerShim = { debug: () => {} }
const callSubflowRegex = /^flow /i
const MAX_STACK_SIZE = 100

class WorkflowEngine {
  constructor(flows, stateManager, options, logger = loggerShim) {
    super()

    this.logger = logger
    this.flows = flows
    this.stateManager = stateManager
    this.defaultFlow = _.get(options, 'defaultFlow') || 'main'
    this.outputProcessors = []
  }

  /**
   * Process a new incoming message from the user.
   * This will execute and run the flow until the flow ends or gets paused by user input
   * @param  {string} stateId The Id of the state. 
   *                          This is usually unique per user/group/channel, depending on the platform.
   * @param  {BPIncomingEvent} event   The incoming event (message)
   * @return {Promise<State>}         Returns a promise that resolves with the new state
   *                                  when the flow is done processing
   */
  async processMessage(stateId, event) {
    let context = this._getOrCreateContext(stateId)
    let state = null

    if (!context.currentFlow) {
      throw new Error('Expected currentFlow to be defined for stateId=' + stateId)
    }

    const catchAllOnReceive = _.get(context, 'currentFlow.catchAll.onReceive')
    if (catchAllOnReceive) {
      this._trace('Executing catchAll : onReceive', context, null)
      state = await this._executeInstructions(context)
    } else {
      state = await this.stateManager.getState(stateId)
    }

    // If there's a 'next' defined in catchAll, this will try to match any condition and if it is matched it
    // will run the node defined in the next instead of the current context node
    const catchAllNext = _.get(context, 'currentFlow.catchAll.next')
    if (catchAllNext) {
      for (let i = 0; i < catchAllNext.length; i++) {
        this._trace(`catchAll #${i} matched, processing node ${catchAllNext[i].node}`, context, state)
        return await this._processNode(stateId, context, catchAllNext[i].node, event)
      }
      this._trace('No catchAll next matched', context, state)
    }

    this._trace('Processing node ' + context.node, context, state)
    return await this._processNode(stateId, context, context.node, event)
  }

  async _processNode(stateId, context, nodeName, event) {
    let switchedFlow = false
    let switchedNode = false

    if (callSubflowRegex.test(nodeName)) {
      // e.g. 'flow login'
      this._trace('--> Going to subflow: ' + nodeName, context, null)
      context = this._gotoSubflow(nodeName, context)
      switchedFlow = true
    } else if (nodeName.startsWith('#')) {
      // e.g. '#success'
      this._trace('<-- Returning to flow: ' + nodeName, context, null)
      context = this._gotoPreviousFlow(context)
      switchedFlow = true
    } else if (context.node !== nodeName) {
      this._trace('Going to node: ' + nodeName)
      switchedNode = true
      context.node = nodeName
    }

    let userState = await this.stateManager.getState(stateId)
    let node = _.find(context.currentFlow, context.node)

    if (!node || !node.name) {
      throw new Error(`Could not find node "${context.node}" in flow "${context.currentFlow.name}"`)
    }

    if (switchedFlow || switchedNode) {
      this._trace('Entering new node ' + context.node, context, userState)
      await this._setContext(stateId, context)

      if (node.onEnter) {
      }
    }
  }

  async _transitionToNextNodes(node, userState, stateId, event) {}

  async _getOrCreateContext(stateId) {
    let state = await this._getContext(stateId)

    if (!state) {
      const flow = this._findFlow(this.defaultFlow)

      if (!flow) {
        throw new Error(`Could not find the default flow "${this.defaultFlow}"`)
      }

      const state = {
        currentFlow: flow,
        node: flow.startNode,
        flowStack: [flow.startNode]
      }

      await this._setContext(stateId, state)
    }

    return state
  }

  _getContext(stateId) {
    return this.stateManager.getState(stateId + '__context')
  }

  _setContext(stateId, state) {
    return this.stateManager.setState(stateId + '__context', state)
  }

  _gotoSubflow(nodeName, context) {
    nodeName = nodeName.replace(callSubflowRegex, '')
    let subflow, subflowNode

    if (nodeName.indexOf('.') > 0) {
      subflow = nodeName.substr(0, nodeName.indexOf('.'))
      subflowNode = nodeName.substr(nodeName.indexOf('.') + 1)
    } else {
      subflow = nodeName
      subflowNode = this._findFlow(subflow).startNode
    }

    Object.assign(context, {
      currentFlow: this._findFlow(subflow),
      node: subflowNode
    })

    context.flowStack.push({
      flow: subflow,
      node: subflowNode
    })

    if (context.flowStack.length >= MAX_STACK_SIZE) {
      throw new Error(
        `Exceeded maximum flow stack size (${MAX_STACK_SIZE}). 
         This might be due to an unexpected infinite loop in your flows.
         Current flow: ${subflow}
         Current node: ${subflowNode}`
      )
      // TODO END FLOW ?
    }

    return context
  }

  _gotoPreviousFlow(nodeName, context) {
    if (context.flowStack.length <= 1) {
      this._trace('Flow tried to go back to previous flow but there was none. Exiting flow.', context, null)
      // TODO END FLOW
    } else {
      context.flowStack.pop()
      let { flow, node } = _.last()

      if (nodeName !== '##') {
        node = nodeName.substr(1)
      }

      Object.assign(context, {
        currentFlow: this._findFlow(flow),
        node: node
      })
    }

    return context
  }

  _findNode(name) {}

  _findFlow(flowName) {}

  _trace(message, context, state) {
    this.logger.debug(message)
  }
}
