import { inject, injectable } from 'inversify'
import _ from 'lodash'

import { Logger } from '../../misc/interfaces'
import { TYPES } from '../../misc/types'
import ActionService from '../action/action-service'

import { DialogProcessor } from './processor'

const BOT_ID = 'bot123'

@injectable()
export class CallProcessor {
  constructor(
    @inject(TYPES.ActionService) private actionService: ActionService,
    @inject(TYPES.Logger) private logger: Logger
  ) {}

  async processCall(call, state, event, context) {
    try {
      if (call.startsWith('say')) {
        this.invokeOutputProcessor(call, state, event, context)
      } else {
        await this.invokeAction(call, state, event, context)
      }
    } catch (err) {
      this.logger.error(err)
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

  private async invokeAction(call, state, event, context): Promise<any> {
    const chunks = call.split(' ')
    const argsStr = _.tail(chunks).join(' ')
    const actionName: string | undefined = _.first(chunks)

    try {
      let args = JSON.parse(argsStr)
      args = _.mapValues(args, value => {
        if (_.isString(value) && value.startsWith('{{') && value.endsWith('}}')) {
          const key = value.substr(2, value.length - 4)
          // s ??
          return _.get({ state: state, s: state, event: event, e: event }, key)
        }
        return value
      })

      console.log('**** ARGUMENTS: ', args)
    } catch (err) {
      throw new Error(`Action "${actionName}" has invalid arguments (not a valid JSON string): ${argsStr}`)
    }

    if (!actionName) {
      throw new Error('Unexpected action formatting')
    }

    const hasAction = await this.actionService.forBot(BOT_ID).hasAction(actionName)
    if (!hasAction) {
      throw new Error(`Action "${actionName}" not found, ${context}, ${state}`)
    }

    return this.actionService.forBot(BOT_ID).runAction(actionName, state, event, argsStr)
  }
}
