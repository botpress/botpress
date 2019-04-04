import { IO } from 'botpress/sdk'
import { UserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { InvalidParameterError } from 'errors'
import { EventEmitter2 } from 'eventemitter2'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'

import { Event } from '../sdk/impl'

import { EventEngine } from './middleware/event-engine'

export const converseApiEvents = new EventEmitter2()

type ResponseMap = Partial<{
  responses: any[]
  nlu: IO.EventUnderstanding
  state: any
  suggestions: IO.Suggestion[]
  decision: IO.Suggestion
}>

@injectable()
export class ConverseService {
  private readonly timeoutInMs = 5000
  private readonly _responseMap: { [target: string]: ResponseMap } = {}

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
      handler: (event: IO.Event, next) => {
        this._handleCapturePayload(event)
        next()
      }
    })

    this.eventEngine.register({
      name: 'converse.capture.context',
      description: 'Captures the event context for the Converse API',
      order: 10000,
      direction: 'incoming',
      handler: (event: IO.Event, next) => {
        this._handleCaptureContext(event as IO.IncomingEvent)
        next()
      }
    })
  }

  public async sendMessage(
    botId: string,
    userId: string,
    payload: any,
    credentials: any,
    includedContexts: string[]
  ): Promise<any> {
    if (!payload.type) {
      payload.type = 'text'
    }

    if (payload.type === 'text' && (!payload.text || !_.isString(payload.text) || payload.text.length > 360)) {
      throw new InvalidParameterError('Text must be a valid string of less than 360 chars')
    }

    await this.userRepository.getOrCreate('api', userId)

    const incomingEvent = Event({
      type: payload.type,
      channel: 'api',
      direction: 'incoming',
      payload,
      target: userId,
      botId,
      credentials,
      nlu: {
        includedContexts
      }
    })

    const timeoutPromise = this._createTimeoutPromise(userId)
    const donePromise = this._createDonePromise(userId)

    await this.eventEngine.sendEvent(incomingEvent)

    return Promise.race([timeoutPromise, donePromise]).finally(() => {
      converseApiEvents.removeAllListeners(`done.${userId}`)
      converseApiEvents.removeAllListeners(`action.start.${userId}`)
      converseApiEvents.removeAllListeners(`action.end.${userId}`)
      delete this._responseMap[userId]
    })
  }

  private async _createDonePromise(userId) {
    return new Promise((resolve, reject) => {
      converseApiEvents.once(`done.${userId}`, event => {
        if (this._responseMap[event.target]) {
          Object.assign(this._responseMap[event.target], <ResponseMap>{
            state: event.state,
            suggestions: event.suggestions,
            decision: event.decision || {}
          })
          return resolve(this._responseMap[event.target])
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

  private _handleCapturePayload(event: IO.Event) {
    if (event.channel !== 'api') {
      return
    }

    if (!this._responseMap[event.target]) {
      this._responseMap[event.target] = { responses: [] }
    }

    this._responseMap[event.target].responses!.push(event.payload)
  }

  private _handleCaptureContext(event: IO.IncomingEvent) {
    if (event.channel !== 'api') {
      return
    }

    if (!this._responseMap[event.target]) {
      this._responseMap[event.target] = { responses: [] }
    }

    Object.assign(this._responseMap[event.target], <ResponseMap>{
      nlu: event.nlu || {},
      suggestions: event.suggestions || [],
      credentials: event.credentials
    })
  }
}
