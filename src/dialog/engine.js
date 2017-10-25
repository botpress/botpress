import _ from 'lodash'
import EventEmitter2 from 'eventemitter2'

class WorkflowEngine extends EventEmitter2 {
  constructor(flows, stateManager, options) {
    super()

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
  async processMessage(stateId, event) {}

  async _getOrCreateContext(stateId) {
    let state = await this._getContext(stateId)

    if (!state) {
      const flow = this._findFlow(this.defaultFlow)

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

  async _processNode(stateId, nodeName, event) {}

  async _transitionToNextNodes(node, userState, stateId, event) {}

  _findNode(name) {}

  _findFlow(flowName) {}
}
