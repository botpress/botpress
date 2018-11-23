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
  private readonly timeoutInMs = 2000
  private jsonMap: Map<string, object> = new Map()

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

    await this.userRepository.getOrCreate('api', userId)

    const incomingEvent = Event({
      type: 'text',
      channel: 'api',
      direction: 'incoming',
      payload,
      target: userId,
      botId
    })

    const timeoutPromise = this._createTimeoutPromise(userId)
    const donePromise = this._createDonePromise(userId)

    await this.eventEngine.sendEvent(incomingEvent)

    return Promise.race([timeoutPromise, donePromise]).finally(() => {
      converseApiEvents.removeAllListeners(`done.${userId}`)
      converseApiEvents.removeAllListeners(`action.start.${userId}`)
      converseApiEvents.removeAllListeners(`action.end.${userId}`)
      this.jsonMap.delete(userId)
    })
  }

  private async _createDonePromise(userId) {
    return new Promise((resolve, reject) => {
      converseApiEvents.once(`done.${userId}`, event => {
        if (this.jsonMap.has(event.target)) {
          const json = this.jsonMap.get(event.target)
          return resolve(json)
        } else {
          return reject(new Error(`No responses found for event target "${event.target}".`))
        }
      })
    })
  }

  // Apply a timeout to prevent hanging in the middleware chain
  private async _createTimeoutPromise(userId) {
    let actionRunning = false

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // We deactivate the timeout for actions because they have their own timeout check
        if (!actionRunning) {
          reject(new Error('Request timed out.'))
        }
      }, this.timeoutInMs)

      converseApiEvents.on(`action.start.${userId}`, () => {
        actionRunning = true
      })

      converseApiEvents.on(`action.end.${userId}`, () => {
        actionRunning = false
        timer.refresh()
      })
    })
  }

  private _handleCapturePayload(event) {
    if (event.channel !== 'api') {
      return
    }

    if (this.jsonMap.has(event.target)) {
      let json = this.jsonMap.get(event.target)
      const responses = _.get(json, 'responses', [])
      const state = _.get(event, 'state', {})
      json = {
        ...json,
        responses: [...responses, event.payload],
        state
      }
      this.jsonMap.set(event.target, json)
    } else {
      const state = _.get(event, 'state', {})
      const json = {
        responses: [event.payload],
        state
      }
      this.jsonMap.set(event.target, json)
    }
  }

  private _handleCaptureNlu(event) {
    if (event.channel !== 'api') {
      return
    }

    if (this.jsonMap.has(event.target)) {
      let json = this.jsonMap.get(event.target)
      const nlu = _.get(event, 'nlu', {})
      json = { ...json, nlu }
      this.jsonMap.set(event.target, json)
    } else {
      const nlu = _.get(event, 'nlu', {})
      const json = { nlu }
      this.jsonMap.set(event.target, json)
    }
  }
}
