import _ from 'lodash'
import Promise from 'bluebird'
import { VM } from 'vm2'

const loggerShim = { debug: () => {} }
const callSubflowRegex = /(.+\.flow\.json)\s?@?\s?(.+)?/i // e.g. './login.flow.json' or './login.flow.json @ username'
const MAX_STACK_SIZE = 100

class DialogEngine {
  constructor(flowsProvider, stateManager, options, logger = loggerShim) {
    this.logger = logger
    this.provider = flowsProvider
    this.flowsLoaded = false
    this.flows = []
    this.stateManager = stateManager
    this.defaultFlow = _.get(options, 'defaultFlow') || 'main.flow.json'
    this.outputProcessors = []
    this.functions = {}
    this.functionMetadataProvider = null

    flowsProvider.on('flowsChanged', () => {
      this.flows = []
      this.flowsLoaded = false
    })
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
    if (!this.flowsLoaded) {
      await this.reloadFlows()
    }

    let context = await this._getOrCreateContext(stateId)
    let state = await this.stateManager.getState(stateId)

    const msg = (event.text || '').substr(0, 20)
    this._trace('<~', 'RECV', `"${msg}"`, context, state)

    if (!context.currentFlow) {
      throw new Error('Expected currentFlow to be defined for stateId=' + stateId)
    }

    const catchAllOnReceive = _.get(context, 'currentFlow.catchAll.onReceive')

    if (catchAllOnReceive) {
      this._trace('!!', 'KALL', '', context, state)
      state = await this._processInstructions(catchAllOnReceive, state, event, context)
    }

    // If there's a 'next' defined in catchAll, this will try to match any condition and if it is matched it
    // will run the node defined in the next instead of the current context node
    const catchAllNext = _.get(context, 'currentFlow.catchAll.next')
    if (catchAllNext) {
      this._trace('..', 'KALL', '', context, state)
      for (let i = 0; i < catchAllNext.length; i++) {
        if (await this._evaluateCondition(catchAllNext[i].condition, state)) {
          return await this._processNode(stateId, context, catchAllNext[i].node, event)
        }
      }

      this._trace('?X', 'KALL', '', context, state)
    }

    return await this._processNode(stateId, context, context.node, event)
  }

  async reloadFlows() {
    this._trace('**', 'LOAD', '')
    this.flows = await this.provider.loadAll()
    this.flowsLoaded = true
  }

  async getFlows() {
    if (!this.flowsLoaded) {
      await this.reloadFlows()
    }

    return this.flows
  }

  /**
   * Registers a new output processor (there can be many, which all get triggered on output).
   * @param {OutpoutProcessor} processor - Is an object with {id, send}
   * @param {string} processor.id - The unique id of the processor
   * @param {Function} processor.send - The `send` function of the processor
   * @returns {void}
   */
  registerOutputProcessor(processor) {
    if (_.isNil(processor) || !_.isFunction(processor.send) || !_.isString(processor.id)) {
      throw new Error('Invalid processor. Processor must have a function `send` defined and a valid `id`')
    }

    _.remove(this.outputProcessors, p => p.id === processor.id)

    this.outputProcessors.push(processor)
  }

  /**
   * Sets the provider of function metadata.
   * The provider is simply an async function that returns metadata information from the function name alone.
   * The metadata lookup is done upon new functions registration
   * @param {Function} A function taking the name of a function, returning metadata of that function
   * Valid metadata could include: "description" and "args[]"
   * @returns {void}
   */
  setFunctionMetadataProvider(provider) {
    if (!_.isFunction(provider)) {
      throw new Error('Expected the function metadata provider to be a function')
    }

    this.functionMetadataProvider = provider
  }

  /**
   * Introduce new functions to the Flows that they can call.
   * @param {Object} fnMap
   * @param {bool} [overwrite=false] - Whether or not it should overwrite existing functions with the same name.
   * Note that if overwrite is false, an error will be thrown on conflict.
   * @returns {Promise.<void>}
   */
  async registerFunctions(fnMap, overwrite = false) {
    const toRegister = {}
    _.keys(fnMap).forEach(name => {
      if (this.functions[name] && !overwrite) {
        throw new Error(`There is already a function named "${name}" registered`)
      }

      let handler = fnMap[name]
      let metadata = null

      if (!_.isFunction(fnMap[name])) {
        if (!_.isObject(fnMap[name]) || !_.isFunction(fnMap[name].handler)) {
          throw new Error(`Expected function "${name}" to be a function or an object with a 'hander' function`)
        }

        handler = fnMap[name].handler
        metadata = Object.assign({}, fnMap[name], { name: name, handler: null })
      }

      if (this.functionMetadataProvider) {
        metadata = Object.assign({}, this.functionMetadataProvider(name) || {}, metadata || {})
      }

      toRegister[name] = {
        name: name,
        metadata: metadata,
        fn: handler
      }
    })

    Object.assign(this.functions, toRegister)
  }

  /**
   * Returns all the available functions along with their metadata
   */
  getAvailableFunctions() {
    return _.values(this.functions).map(x => Object.assign({}, x, { fn: null }))
  }

  async _processNode(stateId, context, nodeName, event) {
    let switchedFlow = false
    let switchedNode = false

    if (callSubflowRegex.test(nodeName)) {
      this._trace('>>', 'FLOW', `"${nodeName}"`, context, null)
      context = this._gotoSubflow(nodeName, context)
      switchedFlow = true
    } else if (nodeName.startsWith('#')) {
      // e.g. '#success'
      this._trace('<<', 'FLOW', `"${nodeName}"`, context, null)
      context = this._gotoPreviousFlow(context)
      switchedFlow = true
    } else if (context.node !== nodeName) {
      this._trace('>>', 'FLOW', `"${nodeName}"`)
      switchedNode = true
      context.node = nodeName
    }

    let userState = await this.stateManager.getState(stateId)
    let node = DialogEngine._findNode(context.currentFlow, context.node)

    if (!node || !node.name) {
      throw new Error(`Could not find node "${context.node}" in flow "${context.currentFlow.name}"`)
    }

    if (switchedFlow || switchedNode) {
      await this._setContext(stateId, context)

      if (node.onEnter) {
        this._trace('!!', 'ENTR', '', context, userState)
        userState = await this._processInstructions(node.onEnter, userState, event, context)
      }

      if (!node.onReceive) {
        this._trace('..', 'NOWT', '', context, userState)
        await this._transitionToNextNodes(node, context, userState, stateId, event)
      }
    } else {
      // i.e. we were already on that node before we received the message
      if (node.onReceive) {
        this._trace('!!', 'RECV', '', context, userState)
        userState = await this._processInstructions(node.onReceive, userState, event, context)
      }

      this._trace('..', 'RECV', '', context, userState)
      await this._transitionToNextNodes(node, context, userState, stateId, event)
    }

    return userState
  }

  async _transitionToNextNodes(node, context, userState, stateId, event) {
    const nextNodes = node.next || []
    for (let i = 0; i < nextNodes.length; i++) {
      if (await this._evaluateCondition(nextNodes[i].condition, userState)) {
        this._trace('??', 'MTCH', `cond = "${nextNodes[i].condition}"`, context)
        if (/end/i.test(nextNodes[i].node)) {
          // Node "END" or "end" ends the flow (reserved keyword)
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
    this._trace('--', 'ENDF', '', null, null)
    await this.stateManager.clearState(stateId) // TODO Implement
    await this._setContext(stateId, null)
  }

  async _getOrCreateContext(stateId) {
    let state = await this._getContext(stateId)

    if (!state || !state.currentFlow) {
      const flow = this._findFlow(this.defaultFlow, true)

      if (!flow) {
        throw new Error(`Could not find the default flow "${this.defaultFlow}"`)
      }

      state = {
        currentFlow: flow,
        node: flow.startNode,
        flowStack: [{ flow: flow.name, node: flow.startNode }]
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

    const flow = this._findFlow(subflow, true)

    if (_.isNil(subflowNode)) {
      subflowNode = flow.startNode
    }

    Object.assign(context, {
      currentFlow: flow,
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
        currentFlow: this._findFlow(flow, true),
        node: node
      })
    }

    return context
  }

  async _processInstructions(instructions, userState, event, context) {
    if (!_.isArray(instructions)) {
      instructions = [instructions]
    }

    await Promise.mapSeries(instructions, async instruction => {
      if (_.isString(instruction) && instruction.startsWith('@')) {
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
        userState = await this._invokeAction(instruction, userState, event, context)
      }
    })

    return userState
  }

  async _dispatchOutput(output, userState, event, context) {
    const msg = String(output.value || '').substr(0, 20)
    this._trace('~>', 'SEND', `"${msg}"`)

    this.outputProcessors.forEach(processor => {
      processor.send({
        message: output,
        state: userState,
        originalEvent: event,
        flowContext: context
      })
    })
  }

  async _invokeAction(instruction, userState, event, context) {
    let name = null
    let args = null

    if (_.isString(instruction)) {
      name = instruction
    } else if (_.isObject(instruction)) {
      if (!instruction.function) {
        this._trace(`ERROR instruction object has no 'function' property set with instruction name`, context, userState)
        return userState
      }
      name = instruction.function
      args = instruction.args
    }

    if (!this.functions[name]) {
      this._trace(`ERROR function "${name}" not found`, context, userState)
    } else {
      try {
        this._trace('!!', 'EXEC', `func "${name}"`, context, userState)
        const ret = await this.functions[name].fn(userState, event, args)

        if (ret && _.isObject(ret)) {
          this._trace('!!', 'SSET', '', context)
          return ret
        }
      } catch (err) {
        this._trace(`ERROR function "${name}" thrown an error: ${err && err.message}`, context, userState)
      }
    }

    return userState
  }

  async _evaluateCondition(condition, userState) {
    if (/^true|always|yes$/i.test(condition) || condition === '') {
      return true
    }

    const vm = new VM({
      timeout: 5000
    })

    _.keys(this.functions).forEach(name => {
      vm.freeze(this.functions[name].fn, name)
    })

    vm.freeze(userState, 's')
    vm.freeze(userState, 'state')

    try {
      return (await vm.run(condition)) == true
    } catch (err) {
      this._trace(`ERROR evaluating condition "${condition}": ${err.message}`, null, userState)
      return false
    }
  }

  static _findNode(flow, nodeName, throwIfNotFound = false) {
    if (throwIfNotFound && _.isNil(flow)) {
      throw new Error(`Could not find node ${nodeName} because the flow was not defined (null)`)
    }

    const node = _.find(flow.nodes, { name: nodeName })

    if (throwIfNotFound && _.isNil(nodeName)) {
      throw new Error(`Could not find node "${nodeName}" in flow "${flow.name}"`)
    }

    return node
  }

  _findFlow(flowName, throwIfNotFound = false) {
    const flow = _.find(this.flows, { name: flowName })

    if (throwIfNotFound && _.isNil(flow)) {
      throw new Error(`Could not find flow "${flowName}"`)
    }

    return flow
  }

  log(message, context, state) {
    const flow = (_.get(context, 'currentFlow.name') || 'NONE').replace(/\.flow\.json/i, '')
    const node = (context && context.node) || 'NONE'
    const msg = `Dialog: [${flow} – ${node}]\t${message}`
    this.logger.debug(msg)
  }

  /**
   * Dialog: [flow] (node) \t OP  RESN  "Description"
   * @param message
   * @param context
   * @param state
   * @private
   */
  _trace(operation, reason, message, context) {
    let flow = (_.get(context, 'currentFlow.name') || ' N/A ').replace(/\.flow\.json/i, '')
    let node = (context && context.node) || ' N/A '

    flow = flow.length > 13 ? flow.substr(0, 13) + '&' : flow
    node = node.length > 13 ? node.substr(0, 13) + '&' : node

    const spc = _.repeat(' ', 30 - flow.length - node.length)

    const msg = `Dialog: [${flow}] (${node}) ${spc} ${operation}  ${reason} \t ${message}`

    this.logger.debug(msg)
  }
}

module.exports = DialogEngine
