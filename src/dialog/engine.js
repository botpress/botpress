import _ from 'lodash'
import EventEmitter2 from 'eventemitter2'

const loggerShim = { debug: () => {} }

class WorkflowEngine extends EventEmitter2 {
  constructor(flows, stateManager, options, logger = loggerShim) {
    super()

    this.logger = logger
    this.flows = flows
    this.stateManager = stateManager
    this.defaultFlow = _.get(options, 'defaultFlow') || 'main'
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
        return await this._processNode(stateId, catchAllNext[i].node, event)
      }
      this._trace('No catchAll next matched', context, state)
    }

    this._trace('Processing node ' + context.node, context, state)
    return await this._processNode(stateId, context.node, event)
  }

  async _processNode(stateId, nodeName, event) {}

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
    return this.stateManager.getState(stateId)
  }

  _setContext(stateId, state) {
    return this.stateManager.setState(stateId, state)
  }

  _findNode(name) {}

  _findFlow(flowName) {}

  _trace(message, context, state) {
    this.logger.debug(message)
  }
}
