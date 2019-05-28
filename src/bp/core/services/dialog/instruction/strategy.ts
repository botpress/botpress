import { IO, Logger } from 'botpress/sdk'
import { CMSService } from 'core/services/cms'
import { EventEngine } from 'core/services/middleware/event-engine'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { NodeVM } from 'vm2'

import { container } from '../../../app.inversify'
import { renderTemplate } from '../../../misc/templating'
import { TYPES } from '../../../types'
import ActionService from '../../action/action-service'
import { VmRunner } from '../../action/vm'

import { Instruction, InstructionType, ProcessingResult } from '.'

const debug = DEBUG('dialog')

@injectable()
export class StrategyFactory {
  create(type: InstructionType): InstructionStrategy {
    if (type === 'on-enter' || type === 'on-receive') {
      return container.get<ActionStrategy>(TYPES.ActionStrategy)
    } else if (type === 'transition') {
      return container.get<TransitionStrategy>(TYPES.TransitionStrategy)
    } else if (type === 'wait') {
      return container.get<WaitStrategy>(TYPES.WaitStrategy)
    }
    throw new Error(`Undefined instruction type "${type}"`)
  }
}

export interface InstructionStrategy {
  processInstruction(botId: string, instruction: Instruction, event): Promise<ProcessingResult>
}

@injectable()
export class ActionStrategy implements InstructionStrategy {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Actions')
    private logger: Logger,
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.CMSService) private cms: CMSService
  ) {}

  async processInstruction(botId, instruction, event): Promise<ProcessingResult> {
    if (instruction.fn.indexOf('say ') === 0) {
      return this.invokeOutputProcessor(botId, instruction, event)
    } else {
      return this.invokeAction(botId, instruction, event)
    }
  }

  private async invokeOutputProcessor(botId, instruction, event: IO.IncomingEvent): Promise<ProcessingResult> {
    const chunks = instruction.fn.split(' ')
    const params = _.slice(chunks, 2).join(' ')

    if (chunks.length < 2) {
      throw new Error('Invalid text instruction. Expected an instruction along "say #text Something"')
    }

    const outputType = chunks[1]
    let args: object = {}

    if (params.length > 0) {
      try {
        args = JSON.parse(params)
      } catch (err) {
        throw new Error(`Say "${outputType}" has invalid arguments (not a valid JSON string): ${params}`)
      }
    }

    debug.forBot(botId, `[${event.target}] render element "${outputType}"`)

    const message: IO.DialogTurnHistory = {
      eventId: event.id,
      incomingPreview: event.preview,
      replyConfidence: 1.0,
      replySource: 'dialogManager',
      replyDate: new Date(),
      replyPreview: outputType
    }

    if (!event.state.session.lastMessages) {
      event.state.session.lastMessages = [message]
    } else {
      event.state.session.lastMessages.push(message)
    }

    args = {
      ...args,
      event,
      user: _.get(event, 'state.user', {}),
      session: _.get(event, 'state.session', {}),
      temp: _.get(event, 'state.temp', {}),
      bot: _.get(event, 'state.bot', {})
    }

    const eventDestination = _.pick(event, ['channel', 'target', 'botId', 'threadId'])
    const renderedElements = await this.cms.renderElement(outputType, args, eventDestination)
    await this.eventEngine.replyToEvent(eventDestination, renderedElements, event.id)

    return ProcessingResult.none()
  }

  private async invokeAction(botId, instruction, event): Promise<ProcessingResult> {
    const chunks: string[] = instruction.fn.split(' ')
    const argsStr = _.tail(chunks).join(' ')
    const actionName = _.first(chunks)!

    let args: { [key: string]: any } = {}
    try {
      if (argsStr && argsStr.length) {
        args = JSON.parse(argsStr)
      }
    } catch (err) {
      throw new Error(`Action "${actionName}" has invalid arguments (not a valid JSON string): ${argsStr}`)
    }

    const actionArgs = {
      event,
      user: _.get(event, 'state.user', {}),
      session: _.get(event, 'state.session', {}),
      temp: _.get(event, 'state.temp', {}),
      bot: _.get(event, 'state.bot', {})
    }

    args = _.mapValues(args, value => renderTemplate(value, actionArgs))

    debug.forBot(botId, `[${event.target}] execute action "${actionName}"`)
    const hasAction = await this.actionService.forBot(botId).hasAction(actionName)
    if (!hasAction) {
      throw new Error(`Action "${actionName}" not found, `)
    }

    await this.actionService.forBot(botId).runAction(actionName, event, args)
    return ProcessingResult.none()
  }
}

@injectable()
export class TransitionStrategy implements InstructionStrategy {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Transition')
    private logger: Logger
  ) {}

  async processInstruction(botId, instruction, event): Promise<ProcessingResult> {
    const conditionSuccessful = await this.runCode(instruction, {
      event,
      user: event.state.user,
      temp: event.state.temp || {},
      session: event.state.session
    })

    if (conditionSuccessful) {
      debug.forBot(
        botId,
        `[${event.target}] eval transition "${instruction.fn === 'true' ? 'always' : instruction.fn}" to [${
          instruction.node
        }]`
      )
      return ProcessingResult.transition(instruction.node)
    } else {
      return ProcessingResult.none()
    }
  }

  private async runCode(instruction, sandbox): Promise<any> {
    const vm = new NodeVM({
      wrapper: 'none',
      sandbox: sandbox,
      timeout: 5000
    })
    const runner = new VmRunner()
    const code = `
    try {
      return ${instruction.fn};
    } catch (err) {
      if (err instanceof TypeError) {
        console.log(err)
        return false
      }
      throw err
    }
    `
    return await runner.runInVm(vm, code)
  }
}

@injectable()
export class WaitStrategy implements InstructionStrategy {
  async processInstruction(botId, instruction, event): Promise<ProcessingResult> {
    return ProcessingResult.wait()
  }
}
