import { UserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { InvalidParameterError } from 'errors'
import { EventEmitter2 } from 'eventemitter2'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'

import { Event } from '../sdk/impl'

import { EventEngine } from './middleware/event-engine'

export const converseApiEvents = new EventEmitter2()

@injectable()
export class ConverseService {
  jsonMap: Map<string, object> = new Map()

  constructor(
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  @postConstruct()
  init() {
    this.eventEngine.register({
      name: 'converse.capture.payload',
      description: 'Captures the response payload for the Converse API',
      order: 10000,
      direction: 'outgoing',
      handler: (event, next) => {
        this._handleCapturePayload(event)
        next()
      }
    })
    this.eventEngine.register({
      name: 'converse.capture.nlu',
      description: 'Captures the nlu output for the Converse API',
      order: 10000,
      direction: 'incoming',
      handler: (event, next) => {
        this._handleCaptureNlu(event)
        next()
      }
    })
  }

  public async sendMessage(botId: string, userId: string, payload): Promise<any> {
    if (!payload.text || !_.isString(payload.text) || payload.text.length > 360) {
      throw new InvalidParameterError('Text must be a valid string of less than 360 chars')
    }

    const sanitizedPayload = _.pick(payload, ['text', 'type', 'data', 'raw'])

    // We remove the password from the persisted messages for security reasons
    if (payload.type === 'login_prompt') {
      sanitizedPayload.data = _.omit(sanitizedPayload.data, ['password'])
    }

    if (payload.type === 'form') {
      sanitizedPayload.data.formId = payload.formId
    }

    const { result: user } = await this.userRepository.getOrCreate('api', userId)

    const incomingEvent = Event({
      type: 'text',
      channel: 'api',
      direction: 'incoming',
      payload,
      target: userId,
      botId
    })

    await this.eventEngine.sendEvent(incomingEvent)

    const timeoutPromise = this._createTimeoutPromise(userId)
    const donePromise = this._createDonePromise(userId)

    return Promise.race([timeoutPromise, donePromise])
  }

  private _createDonePromise(userId) {
    return new Promise(resolve => {
      converseApiEvents.once('done', event => {
        if (event.target === userId) {
          const json = this.jsonMap.get(event.target)
          this.jsonMap.delete(event.target)
          return resolve(json)
        }
      })
    })
  }

  private _createTimeoutPromise(userId) {
    return new Promise(resolve => {
      converseApiEvents.on('action.running', event => {
        if (event.target === userId) {
          // ignore
        } else {
          const wait = setTimeout(() => {
            clearTimeout(wait)
            resolve({ error: 'Request timed out!' }) // TODO: Use reject on promise and use an error
          }, 1000)
        }
      })
    })
  }

  private _handleCapturePayload(event) {
    if (this.jsonMap.has(event.target)) {
      let json = this.jsonMap.get(event.target)
      json = {
        ...json,
        response: [..._.get(json, 'response', []), event.payload],
        state: _.get(event, 'state', {})
      }
      this.jsonMap.set(event.target, json)
    } else {
      const json = {
        response: [event.payload],
        state: _.get(event, 'state', {})
      }
      this.jsonMap.set(event.target, json)
    }
  }

  private _handleCaptureNlu(event) {
    if (this.jsonMap.has(event.target)) {
      let json = this.jsonMap.get(event.target)
      json = { ...json, nlu: _.get(event, 'nlu', {}) }
      this.jsonMap.set(event.target, json)
    } else {
      const json = { nlu: _.get(event, 'nlu', {}) }
      this.jsonMap.set(event.target, json)
    }
  }
}
