import { inject, injectable } from 'inversify'
import _ from 'lodash'
import Mustache from 'mustache'
import { VError } from 'verror'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import ActionService from '../action/action-service'

const BOT_ID = 'bot123'

@injectable()
export class CallProcessor {
  constructor(
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async processCall(call, state, event, context) {
    try {
      if (call.startsWith('say ')) {
        this.invokeOutputProcessor(call, state, event, context)
      } else {
        await this.invokeAction(call, state, event, context)
      }
    } catch (err) {
      throw new VError(`Error while processing the instruction, ${err}`)
    }
  }

  private invokeOutputProcessor(call, state, event, context) {
    const chunks = call.split(' ')
    const params = _.slice(chunks, 2).join(' ')

    if (chunks.length < 2) {
      throw new Error('Invalid text instruction. Expected an instruction along "say #text Something"')
    }

    const output = {
      type: chunks[1],
      value: params
    }

    // Wont work! No reply in MW?
    // DialogProcessor.default.send({ message: output, state: state, originalEvent: event, flowContext: context })
  }

  // TODO: Test for nested templating
  private async invokeAction(call, state, event, context): Promise<any> {
    const chunks: string[] = call.split(' ')
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

    const hasAction = await this.actionService.forBot(BOT_ID).hasAction(actionName)
    console.log('HAS ACTION', hasAction)
    if (!hasAction) {
      throw new Error(`Action "${actionName}" not found, ${context}, ${state}`)
    }
    return this.actionService.forBot(BOT_ID).runAction(actionName, state, event, args)
  }

  private containsTemplate(value: string) {
    return _.isString(value) && value.indexOf('{{') < value.indexOf('}}')
  }
}
