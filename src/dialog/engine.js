import _ from 'lodash'
import Promise from 'bluebird'
import { VM } from 'vm2'

const loggerShim = { debug: () => {} }
const callSubflowRegex = /(.+\.flow\.json)\s?@?\s?(.+)?/i // e.g. './login.flow.json' or './login.flow.json @ username'
const MAX_STACK_SIZE = 100

class WorkflowEngine {

  constructor(flows, stateManager, options, logger = loggerShim) {
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
    let state = await this.stateManager.getState(stateId)

    if (!context.currentFlow) {
      throw new Error('Expected currentFlow to be defined for stateId=' + stateId)
    }

    const catchAllOnReceive = _.get(context, 'currentFlow.catchAll.onReceive')
    if (catchAllOnReceive) {
      this._trace('Executing catchAll : onReceive', context, null)
      state = await this._processInstructions(catchAllOnReceive, state, event, context)
    }

    // If there's a 'next' defined in catchAll, this will try to match any condition and if it is matched it
    // will run the node defined in the next instead of the current context node
    const catchAllNext = _.get(context, 'currentFlow.catchAll.next')
    if (catchAllNext) {
      for (let i = 0; i < catchAllNext.length; i++) {
        if (await WorkflowEngine._evaluateCondition(catchAllNext[i].condition, state)) {
          this._trace(`catchAll #${i} matched, processing node ${catchAllNext[i].node}`, context, state)
          return await this._processNode(stateId, context, catchAllNext[i].node, event)
        }
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
    let node = WorkflowEngine._findNode(context.currentFlow, context.node)

    if (!node || !node.name) {
      throw new Error(`Could not find node "${context.node}" in flow "${context.currentFlow.name}"`)
    }

    if (switchedFlow || switchedNode) {
      this._trace(`Entering node "${node.name}" (${node.id})`, context, userState)
      await this._setContext(stateId, context)

      if (node.onEnter) {
        this._trace(`Executing onEnter instructions`, context, userState)
        userState = await this._processInstructions(node.onEnter, userState, event, context)
      }

      if (!node.onReceive) {
        this._trace(`Node has no 'onReceive', not waiting for user input and skipping to next nodes`,
          context, userState)
        await this._transitionToNextNodes(node, context, userState, stateId, event)
      }
    } else { // i.e. we were already on that node before we received the message
      if (node.onReceive) {
        userState = await this._processInstructions(node.onReceive, userState, event, context)
      }

      await this._transitionToNextNodes(node, context, userState, stateId, event)
    }

    return userState
  }

  async _transitionToNextNodes(node, context, userState, stateId, event) {
    const nextNodes = node.next || []
    for (let i = 0; i < nextNodes; i++) {
      if (await WorkflowEngine._evaluateCondition(nextNodes[i].condition, userState)) {
        if (/end/i.test(nextNodes[i].node)) { // Node "END" or "end" ends the flow (reserved keyword)
          await this._endFlow(stateId)
          return {}
        } else {
          return await this._processNode(stateId, context, nextNodes[i].node, event)
        }
      }
    }

    // You reach this if there were no next nodes, in which case we end the flow
    await this._endFlow(stateId)
    return {}
  }

  async _endFlow(stateId) {
    await this.stateManager.clearState(stateId) // TODO Implement
    await this._setContext(stateId, null)
  }

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
    let [, subflow, subflowNode] = nodeName.match(callSubflowRegex)

    if (_.isNil(subflowNode)) {
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

  async _processInstructions(instructions, userState, event, context) {
    if (_.isString(instructions)) {
      instructions = [instructions]
    }

    if (!_.isArray(instructions)) {
      throw new Error(`Unexpected instructions.
        Expected an array but received: ${typeof instructions}
        Flow: ${context.currentFlow.name}
        Node: ${context.node}`)
    }

    await Promise.mapSeries(instructions, async instruction => {
      if (instruction.startsWith('@')) {
        await this._dispatchOutput(
          {
            type: 'text',
            value: instruction.substr(1)
          },
          userState,
          event,
          context
        )
      } else {
        userState = await WorkflowEngine._invokeAction(instruction, userState, event, context)
      }
    })

    return userState
  }

  async _dispatchOutput(output, userState, event, context) {
    console.log('-->> Dispatch output :' + JSON.stringify(output) + ' (TODO)')
  }

  static async _invokeAction(instruction, userState, event, context) {
    console.log('-->> Invoke action:' + JSON.stringify(instruction) + ' (TODO)')
    return userState
  }

  static async _evaluateCondition(condition, userState) {
    const vm = new VM({
      timeout: 5000
    })

    vm.freeze(userState, 's')
    vm.freeze(userState, 'state')

    return await vm.run(condition) == true
  }

  static _findNode(flow, nodeName, throwIfNotFound = false) {
    if (throwIfNotFound && _.isNil(flow)) {
      throw new Error(`Could not find node ${nodeName} because the flow was not defined (null)`)
    }

    const node =_.find(flow.nodes, { name: nodeName })

    if (throwIfNotFound && _.isNil(nodeName)) {
      throw new Error(`Could not find node "${nodeName}" in flow "${flow.name}"`)
    }

    return node
  }

  _findFlow(flowName, throwIfNotFound = false) {
    const flow =_.find(this.flows, { name: flowName })

    if (throwIfNotFound && _.isNil(flow)) {
      throw new Error(`Could not find flow "${flowName}"`)
    }

    return flow
  }

  _trace(message, context, state) {
    this.logger.debug(message)
  }
}
