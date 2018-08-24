import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { NodeVM } from 'vm2'

import { TYPES } from '../../misc/types'
import Logger from '../../Logger'
import { MiddlewareChain } from '../middleware/middleware'

import { Flow, FlowNode, FlowView } from '.'
import FlowService from './flow-service'
import { SessionService } from './session-service'

type Context = {
  currentFlow: any
  node: any
  hasJumped: boolean
  flowStack: { flow: any; node: any }[]
}

const VM_TIMEOUT = 5000
const MAX_STACK_SIZE = 100
const callSubflowRegex = /(.+\.flow\.json)\s?@?\s?(.+)?/i // e.g. './login.flow.json' or './login.flow.json @ username'

export class ScoppedDialogEngine {
  private readonly defaultFlow: string = 'main.flow.json'

  private flowsLoaded: boolean = false
  private flows!: FlowView[]
  private errorHandlers: any[] = []
  private outputProcessors: any[] = []
  private actionMetadataProviders: any[] = []
  private actions = {}

  constructor(
    private botId: string,
    private flowService: FlowService,
    private sessionService: SessionService,
    private logger: Logger
  ) {}

  onBeforeCreated = new MiddlewareChain<any>()
  onAfterCreated = new MiddlewareChain<any>()
  onBeforeEnd = new MiddlewareChain<any>()
  onBeforeNodeEnter = new MiddlewareChain<any>()
  onBeforeSessionTimeout = new MiddlewareChain<any>()
  onError = (fn: Function) => this.errorHandlers.push(fn)

  // TODO: impl actions
  async getAvailableActions() {
    return this.actions
  }

  async getCurrentPosition(sessionId: string) {
    const context = await this._getContextForSession(sessionId)
    if (context) {
      return {
        flow: context.currentFlow && context.currentFlow.name,
        node: context.node
      }
    }

    throw new Error(`Could not find any position for the current state ID '${sessionId}'`)
  }

  private _getContextForSession(sessionId): Promise<any> {
    return this.sessionService.getContextForSession(sessionId)
  }

  private _setContextForSession(sessionId, context: Context) {
    return this.sessionService.setContextForSession(sessionId, context)
  }

  async getFlows(): Promise<FlowView[]> {
    if (!this.flowsLoaded) {
      await this._reloadFlows()
    }

    return this.flows
  }

  private async _reloadFlows() {
    this._trace('**', 'LOAD', '', undefined)
    this.flows = await this.flowService.loadAll(this.botId)
    this.flowsLoaded = true
  }

  async endFlow(sessionId: string) {
    this._trace('--', 'ENDF', '', undefined)
    // await this.onBeforeEnd.run(new Event('onBeforeEnd'), { sessionId })
    await this.sessionService.deleteSession(sessionId)
    return undefined
  }

  async jumpTo(sessionId: string, flowName: string, nodeName: string, options: { resetState: false }) {
    if (!this.flowsLoaded) {
      await this._reloadFlows()
    }

    const flow = this._findFlow(flowName)

    if (nodeName) {
      this._findNode(flow, nodeName)
    }

    await this._setContextForSession(sessionId, {
      currentFlow: flow,
      node: nodeName || flow.startNode,
      hasJumped: true,
      flowStack: [{ flow: flow.name, node: nodeName || flow.startNode }]
    })

    if (options.resetState) {
      await this.sessionService.deleteSession(sessionId)
    }
  }

  private _findNode(flow: Flow, nodeName: string): FlowNode {
    if (!flow) {
      throw new Error(`Could not find node ${nodeName} because the flow was not defined (null)`)
    }

    const node = _.find(flow.nodes, { name: nodeName })

    if (!node) {
      throw new Error(`Could not find node "${nodeName}" in flow "${flow.name}"`)
    }

    return node
  }

  private _findFlow(flowName: string): FlowView {
    const flow = _.find(this.flows, { name: flowName })

    if (!flow) {
      throw new Error(`Could not find flow "${flowName}"`)
    }

    return flow
  }

  async processMessage(sessionId: string, event: any) {
    try {
      if (!this.flowsLoaded) {
        await this._reloadFlows()
      }

      const context = await this.getOrCreateContext(sessionId)

      console.log('*** CONTEXT', context)

      let session = await this.sessionService.getSession(sessionId)

      if (event.type === 'bp_dialog_timeout') {
        session = await this._processTimeout(sessionId, session.state, context, event)

        if (!session) {
          await this.sessionService.createSession(session)
        }

        return session
      }

      const msg = (event.text || '').substr(0, 20)
      this._trace('<~', 'RECV', `"${msg}"`, context)

      if (!context.currentFlow) {
        throw new Error('Expected currentFlow to be defined for stateId=' + sessionId)
      }

      const catchAllOnReceive = _.get(context, 'currentFlow.catchAll.onReceive')

      if (catchAllOnReceive) {
        this._trace('!!', 'KALL', '', context)
        session = await this._processInstructions(catchAllOnReceive, session, event, context)
      }

      // If there's a 'next' defined in catchAll, this will try to match any condition and if it is matched it
      // will run the node defined in the next instead of the current context node
      const catchAllNext = _.get(context, 'currentFlow.catchAll.next')
      if (catchAllNext) {
        this._trace('..', 'KALL', '', context)
        for (let i = 0; i < catchAllNext.length; i++) {
          if (await this._evaluateCondition(catchAllNext[i].condition, session, event)) {
            return this._processNode(sessionId, session, context, catchAllNext[i].node, event)
          }
        }

        this._trace('?X', 'KALL', '', context)
      }

      session = await this._processNode(sessionId, session.state, context, context.node, event)

      if (!_.isNil(session)) {
        await this.sessionService.createSession(session)
      }

      return session
    } catch (e) {
      this.errorHandlers.forEach(errorHandler => errorHandler(e))
    }
  }

  private async _processTimeout(sessionId: string, userState: any, context: Context, event: any) {
    const beforeCtx = { sessionId }
    // await this.onBeforeSessionTimeout.run(new Event('onBeforeSessionTimeout'), beforeCtx)

    const currentNodeTimeout = context.node.timeoutNode
    const currentFlowTimeout = context.currentFlow.timeoutNode
    const fallbackTimeoutNode = context.currentFlow.timeout
    const fallbackTimeoutFlow = this._findFlow('timeout.flow.json')

    if (currentNodeTimeout) {
      this._trace('<>', 'SNDE', '', context)
      userState = await this._processNode(sessionId, userState, context, currentNodeTimeout, event)
    } else if (currentFlowTimeout) {
      this._trace('<>', 'SFLW', '', context)
      userState = await this._processNode(sessionId, userState, context, currentFlowTimeout, event)
    } else if (fallbackTimeoutNode) {
      this._trace('<>', 'DNDE', '', context)
      // userState = await this._processNode(sessionId, userState, context, fallbackTimeoutNode.name, event)
    } else if (fallbackTimeoutFlow) {
      this._trace('<>', 'DFLW', '', context)
      // userState = await this._processNode(sessionId, userState, context, fallbackTimeoutFlow.name, event)
    } else {
      this._trace('<>', 'NTHG', '', context)
      userState = await this.endFlow(sessionId)
    }

    return userState
  }

  private async _processNode(sessionId: string, userState: any, context: Context, nodeName: string, event: any) {
    let switchedFlow = false
    let switchedNode = false

    if (context.hasJumped) {
      context.hasJumped = false
      switchedNode = true
    }

    const originalFlow = context.currentFlow.name
    const originalNode = context.node

    if (callSubflowRegex.test(nodeName)) {
      this._trace('>>', 'FLOW', `"${nodeName}"`, context)
      context = this._gotoSubflow(nodeName, context)
      switchedFlow = true
    } else if (/^#/.test(nodeName)) {
      // e.g. '#success'
      this._trace('<<', 'FLOW', `"${nodeName}"`, context)
      context = this._gotoPreviousFlow(nodeName, context)
      switchedFlow = true
    } else if (context.node.name !== nodeName) {
      this._trace('>>', 'FLOW', `"${nodeName}"`, context)
      switchedNode = true
      context.node.name = nodeName
    } else if (!context.node) {
      // We just created the context
      switchedNode = true
      context.node = context.currentFlow.startNode
    }

    const node = this._findNode(context.currentFlow.nodes, context.node)

    if (!node || !node.name) {
      userState = await this.endFlow(sessionId)
      return userState
      // TODO Trace error
      throw new Error(`Could not find node "${context.node}" in flow "${context.currentFlow.name}"`)
    }

    if (switchedFlow || switchedNode) {
      context.flowStack.push({
        flow: context.currentFlow.name,
        node: context.node.name
      })

      // Flattens the stack to only include flow jumps, not node jumps
      context.flowStack = context.flowStack.filter((el, i) => {
        return i === context.flowStack.length - 1 || context.flowStack[i + 1].flow !== el.flow
      })

      if (context.flowStack.length >= MAX_STACK_SIZE) {
        throw new Error(
          `Exceeded maximum flow stack size (${MAX_STACK_SIZE}).
         This might be due to an unexpected infinite loop in your flows.
         Current flow: ${context.currentFlow.name}
         Current node: ${context.node.name}`
        )
      }

      await this._setContextForSession(sessionId, context)

      const beforeCtx = { sessionId, node }
      // await this.onBeforeNodeEnter.run(new Event('onBeforeNodeEnter'), beforeCtx)

      if (node.onEnter) {
        this._trace('!!', 'ENTR', '', context)
        userState = await this._processInstructions(node.onEnter, userState, event, context)
      }

      if (!node.onReceive) {
        this._trace('..', 'NOWT', '', context)

        if (node.type === 'skill-call' && originalFlow !== node.flow) {
          userState = await this._processNode(sessionId, userState, context, node.flow, event)
        } else {
          userState = await this._transitionToNextNodes(node, context, userState, sessionId, event)
        }
      }
    } else {
      // i.e. we were already on that node before we received the message
      if (node.onReceive) {
        this._trace('!!', 'RECV', '', context)
        userState = await this._processInstructions(node.onReceive, userState, event, context)
      }

      this._trace('..', 'RECV', '', context)

      if (node.type === 'skill-call' && originalFlow !== node.flow) {
        userState = await this._processNode(sessionId, userState, context, node.flow, event)
      } else {
        userState = await this._transitionToNextNodes(node, context, userState, sessionId, event)
      }
    }

    return userState
  }

  private _gotoSubflow(nodeName: string, context: Context) {
    // tslint:disable-next-line:prefer-const
    let [subflow, subflowNode] = nodeName.match(callSubflowRegex)!

    const flow = this._findFlow(subflow)

    if (!subflowNode) {
      subflowNode = flow.startNode
    }

    context.currentFlow = flow
    context.node = subflowNode

    return context
  }

  private _gotoPreviousFlow(nodeName: string, context: Context) {
    if (!context.flowStack) {
      context.flowStack = []
    }

    while (context.currentFlow.name === _.get(_.last(context.flowStack), 'flow')) {
      context.flowStack.pop()
    }

    if (context.flowStack.length < 1) {
      this._trace('Flow tried to go back to previous flow but there was none. Exiting flow.', '', '', context)
      // TODO END FLOW
    } else {
      // tslint:disable-next-line:prefer-const
      let { flow, node } = _.last(context.flowStack)!

      if (nodeName !== '#') {
        node = nodeName.substr(1)
      }

      context.currentFlow = this._findFlow(flow)
      context.node = node
    }

    return context
  }

  private async _processInstructions(instructions, userState, event, context: Context) {
    if (!_.isArray(instructions)) {
      instructions = [instructions]
    }

    await Promise.mapSeries(instructions, async instruction => {
      if (_.isString(instruction) && instruction.startsWith('say ')) {
        const chunks = instruction.split(' ')
        const params = _.slice(chunks, 2).join(' ')

        if (chunks.length < 2) {
          this._trace('ERROR Invalid text instruction. Expected an instruction along "say #text Something"', '', '', '')
          return userState
        }

        await this._dispatchOutput(
          {
            type: chunks[1], // e.g. "#text" or "#!trivia-12342"
            value: params // e.g. Any additional parameter provided to the template
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

  async _transitionToNextNodes(node, context, userState, sessionId, event) {
    const nextNodes = node.next || []
    for (let i = 0; i < nextNodes.length; i++) {
      if (await this._evaluateCondition(nextNodes[i].condition, userState, event)) {
        this._trace('??', 'MTCH', `cond = "${nextNodes[i].condition}"`, context)
        if (/^end$/i.test(nextNodes[i].node)) {
          // Node "END" or "end" ends the flow (reserved keyword)
          return this.endFlow(sessionId)
        } else {
          return this._processNode(sessionId, userState, context, nextNodes[i].node, event)
        }
      }
    }

    if (!nextNodes.length) {
      // You reach this if there were no next nodes, in which case we end the flow
      return this.endFlow(sessionId)
    }

    return userState
  }

  private async _dispatchOutput(output, userState, event, context) {
    const msg = String(output.type + (output.value || '')).substr(0, 20)
    this._trace('~>', 'SEND', `"${msg}"`, '')

    return Promise.map(this.outputProcessors, processor =>
      processor.send({ message: output, state: userState, originalEvent: event, flowContext: context })
    )
  }

  private async _invokeAction(instruction, userState, event, context) {
    let name = ''
    let args = {}

    if (_.isString(instruction)) {
      if (instruction.includes(' ')) {
        const chunks = instruction.split(' ')
        const argsStr = _.tail(chunks).join(' ')
        name = _.first(chunks)!
        try {
          args = JSON.parse(argsStr)
          args = _.mapValues(args, value => {
            if (_.isString(value) && value.startsWith('{{') && value.endsWith('}}')) {
              const key = value.substr(2, value.length - 4)
              return _.get({ state: userState, s: userState, event: event, e: event }, key)
            }
            return value
          })
        } catch (err) {
          throw new Error('ERROR function has invalid arguments (not a valid JSON string): ' + argsStr)
        }
      } else {
        name = instruction
      }
    } else {
      this._trace(`ERROR function is not a valid string`)
    }

    if (!this.actions[name]) {
      this._trace(`ERROR function "${name}" not found`, '', '', context)
    } else {
      try {
        this._trace('!!', 'EXEC', `func "${name}"`, context)
        const ret = await this.actions[name].fn(Object.freeze(userState), event, args || {})

        if (ret && _.isObject(ret)) {
          if (Object.isFrozen(ret)) {
            this._trace(
              `ERROR function "${name}" returned the original (frozen) state. You should clone the state (see 'Object.assign()') instead of returning the original state.`,
              '',
              '',
              context
            )
          } else {
            this._trace('!!', 'SSET', '', context)
            return ret
          }
        }
      } catch (err) {
        throw new Error(`ERROR function "${name}" thrown an error: ${err && err.message}`)
      }
    }

    return userState
  }

  private async _evaluateCondition(condition, userState, event) {
    if (/^true|always|yes$/i.test(condition) || condition === '') {
      return true
    }

    const vm = new NodeVM({
      timeout: VM_TIMEOUT
    })

    _.keys(this.actions).forEach(name => {
      vm.freeze(this.actions[name].fn, name)
    })

    vm.freeze(userState, 's')
    vm.freeze(userState, 'state')
    vm.freeze(event, 'event')
    vm.freeze(event, 'e')

    try {
      return (await vm.run(condition)) == true
    } catch (err) {
      throw new Error(`ERROR evaluating condition "${condition}": ${err.message}`)
    }
  }

  private async getOrCreateContext(sessionId: string): Promise<Context> {
    let state = await this._getContextForSession(sessionId)

    console.log(state)

    if (!state || !state.currentFlow) {
      const beforeCtx = { sessionId, flowName: this.defaultFlow }
      await this.onBeforeCreated.use((event, next) => {})

      const flow = this._findFlow(beforeCtx.flowName)

      if (!flow) {
        throw new Error(`Could not find the default flow "${this.defaultFlow}"`)
      }

      state = {
        currentFlow: flow.name,
        flowStack: [{ flow: flow.name, node: flow.startNode }]
      }

      await this._setContextForSession(sessionId, state)

      const afterCtx = { ...beforeCtx }
      // await this.onAfterCreated.run(new Event('onAfterCreated'), afterCtx)
    }

    return state
  }

  async registerActions(fnMap, overwrite = false) {
    const toRegister = {}
    _.keys(fnMap).forEach(name => {
      if (this.actions[name] && !overwrite) {
        throw new Error(`There is already a function named "${name}" registered`)
      }

      let handler = fnMap[name]
      let metadata = undefined

      if (!_.isFunction(fnMap[name])) {
        if (!_.isObject(fnMap[name]) || !_.isFunction(fnMap[name].handler)) {
          throw new Error(`Expected function "${name}" to be a function or an object with a 'hander' function`)
        }

        handler = fnMap[name].handler
        metadata = Object.assign({}, fnMap[name], { name: name, handler: undefined })
      }

      for (const provider of this.actionMetadataProviders) {
        const extra = provider(name)

        if (extra) {
          metadata = Object.assign({}, extra, metadata || {})
          break
        }
      }

      toRegister[name] = {
        name: name,
        metadata: metadata,
        fn: handler
      }
    })

    Object.assign(this.actions, toRegister)
  }

  registerActionMetadataProvider(provider) {
    if (!_.isFunction(provider)) {
      throw new Error('Expected the function metadata provider to be a function')
    }

    if (!_.includes(this.actionMetadataProviders, provider)) {
      this.actionMetadataProviders.push(provider)
    }
  }

  registerOutputProcessor(processor) {
    if (_.isNil(processor) || !_.isFunction(processor.send) || !_.isString(processor.id)) {
      throw new Error('Invalid processor. Processor must have a function `send` defined and a valid `id`')
    }

    // For now we only ever support a single output processor
    // We might want many output processors in the future, for example to hook up a debugger or a test suite
    this.outputProcessors = [processor]
  }

  private _trace(operation, reason?, message?, context?) {
    let flow = (_.get(context, 'currentFlow.name') || ' N/A ').replace(/\.flow\.json/i, '')
    let node = (context && context.node) || ' N/A '

    flow = flow.length > 13 ? flow.substr(0, 13) + '&' : flow
    node = node.length > 13 ? node.substr(0, 13) + '&' : node

    const spc = _.repeat(' ', 30 - flow.length - node.length)

    const msg = `[${flow}] (${node}) ${spc} ${operation}  ${reason} \t ${message}`
    this.logger.debug(msg)
  }
}

@injectable()
export class DialogEngine {
  constructor(
    @inject(TYPES.FlowService) private flowService: FlowService,
    @inject(TYPES.SessionService) private sessionService: SessionService,
    @inject(TYPES.Logger)
    @tagged('name', 'DialogEngine')
    private logger: Logger
  ) {}

  forBot(botId: string): ScoppedDialogEngine {
    return new ScoppedDialogEngine(botId, this.flowService, this.sessionService, this.logger)
  }
}
