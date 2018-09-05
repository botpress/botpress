import { BotpressEvent } from 'botpress-module-sdk'
import { inject, injectable } from 'inversify'
import _ from 'lodash'
import Mustache from 'mustache'

import { container } from '../../../app.inversify'
import { TYPES } from '../../../misc/types'
import ActionService from '../../action/action-service'
import { runCode } from '../../action/sandbox-launcher'
import { EventEngine } from '../../middleware/event-engine'

import { Instruction, InstructionType, ProcessingResult } from '.'

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
  processInstruction(botId: string, instruction: Instruction, state, event, context): Promise<ProcessingResult>
}

@injectable()
export class ActionStrategy implements InstructionStrategy {
  constructor(@inject(TYPES.ActionService) private actionService: ActionService) {}

  async processInstruction(botId, instruction, state, event, context): Promise<ProcessingResult> {
    if (instruction.fn.indexOf('say ') === 0) {
      return this.invokeOutputProcessor(botId, instruction, event)
    } else {
      return this.invokeAction(botId, instruction, state, event, context)
    }
  }

  private async invokeOutputProcessor(botId, instruction, event: BotpressEvent): Promise<ProcessingResult> {
    const chunks = instruction.fn.split(' ')
    const params = _.slice(chunks, 2).join(' ')

    if (chunks.length < 2) {
      throw new Error('Invalid text instruction. Expected an instruction along "say #text Something"')
    }

    const output = {
      type: chunks[1],
      value: params
    }

    // await this.eventEngine.sendContent(botId, chunks[1], event.target, event.channel) // FIXME

    return ProcessingResult.none()

    // Wont work! No reply in MW ?
    // DialogProcessor.default.send({ message: output, state: state, originalEvent: event, flowContext: context })
  }

  // TODO: Test for nested templating
  private async invokeAction(botId, instruction, state, event, context): Promise<ProcessingResult> {
    const chunks: string[] = instruction.fn.split(' ')
    const argsStr = _.tail(chunks).join(' ')
    const actionName = _.first(chunks)!

    let args
    try {
      args = JSON.parse(argsStr)
    } catch (err) {
      throw new Error(`Action "${actionName}" has invalid arguments (not a valid JSON string): ${argsStr}`)
    }

    args = _.mapValues(args, value => {
      if (this.containsTemplate(value)) {
        const output = Mustache.render(value, state)
        if (this.containsTemplate(output)) {
          return Mustache.render(output, state)
        }
        return output
      }
      return value
    })

    const hasAction = await this.actionService.forBot(botId).hasAction(actionName)
    if (!hasAction) {
      throw new Error(`Action "${actionName}" not found, ${context}, ${state}`)
    }

    await this.actionService.forBot(botId).runAction(actionName, state, event, args)

    return ProcessingResult.none()
  }

  private containsTemplate(value: string) {
    return _.isString(value) && value.indexOf('{{') < value.indexOf('}}')
  }
}

@injectable()
export class TransitionStrategy implements InstructionStrategy {
  async processInstruction(botId, instruction, state, event, context): Promise<ProcessingResult> {
    const result = await runCode(`return ${instruction.fn}`, { state, event })
    if (result) {
      return ProcessingResult.transition(instruction.node)
    } else {
      return ProcessingResult.none()
    }
  }
}

@injectable()
export class WaitStrategy implements InstructionStrategy {
  async processInstruction(botId, instruction, state, event, context): Promise<ProcessingResult> {
    return ProcessingResult.wait()
  }
}
