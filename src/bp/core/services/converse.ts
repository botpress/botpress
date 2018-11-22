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
  private readonly timeoutInMs = 2500
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

    await this.eventEngine.sendEvent(incomingEvent)

    const timeoutPromise = this._createTimeoutPromise(userId)
    const donePromise = this._createDonePromise(userId)

    return Promise.race([timeoutPromise, donePromise])
  }

  private async _createDonePromise(userId) {
    return new Promise((resolve, reject) => {
      const doneEvent = `done.${userId}`

      converseApiEvents.removeAllListeners(doneEvent)
      converseApiEvents.once(doneEvent, event => {
        if (this.jsonMap.has(event.target)) {
          const json = this.jsonMap.get(event.target)
          this.jsonMap.delete(event.target)

          return resolve(json)
        } else {
          return reject(`No responses found for event target "${event.target}".`)
        }
      })
    })
  }

  private async _createTimeoutPromise(userId) {
    return new Promise((resolve, reject) => {
      const actionEvent = `action.${userId}`
      const wait = setTimeout(() => {
        converseApiEvents.removeAllListeners(`action.${userId}`)
        converseApiEvents.removeAllListeners(`done.${userId}`)
        this.jsonMap.delete(userId)
        reject('Request timed out.')
      }, this.timeoutInMs)

      converseApiEvents.on(actionEvent, () => {
        clearTimeout(wait)
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
