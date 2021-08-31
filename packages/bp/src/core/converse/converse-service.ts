import { IO } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { EventEngine, Event } from 'core/events'
import { TYPES } from 'core/types'
import { ChannelUserRepository } from 'core/users'
import { InvalidParameterError } from 'errors'
import { EventEmitter2 } from 'eventemitter2'
import { inject, injectable, postConstruct } from 'inversify'
import { AppLifecycle, AppLifecycleEvents } from 'lifecycle'
import _ from 'lodash'
import ms from 'ms'

export const converseApiEvents = new EventEmitter2()

type ResponseMap = Partial<{
  responses: any[]
  nlu: IO.EventUnderstanding
  state: any
  suggestions: IO.Suggestion[]
  decision: IO.Suggestion
}>

export const buildUserKey = (botId: string, target: string) => `${botId}_${target}`

@injectable()
export class ConverseService {
  private readonly _responseMap: { [target: string]: ResponseMap } = {}

  constructor(
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.EventEngine) private eventEngine: EventEngine,
    @inject(TYPES.UserRepository) private userRepository: ChannelUserRepository
  ) {}

  @postConstruct()
  async init() {
    await AppLifecycle.waitFor(AppLifecycleEvents.CONFIGURATION_LOADED)

    this.eventEngine.register({
      name: 'converse.capture.payload',
      description: 'Captures the response payload for the Converse API',
      order: 10000,
      direction: 'outgoing',
      handler: (event: IO.Event, next) => {
        if (event.channel !== 'api') {
          return next(undefined, false, true)
        }

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
        if (event.channel !== 'api') {
          return next(undefined, false, true)
        }

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

    let maxMessageLength = _.get(await this.configProvider.getBotConfig(botId), 'converse.maxMessageLength')

    if (!maxMessageLength) {
      maxMessageLength = _.get(await this.configProvider.getBotpressConfig(), 'converse.maxMessageLength', 360)
    }

    if (
      payload.type === 'text' &&
      (!payload.text || !_.isString(payload.text) || payload.text.length > maxMessageLength)
    ) {
      throw new InvalidParameterError(`Text must be a valid string of less than ${maxMessageLength} chars`)
    }

    await this.userRepository.getOrCreate('api', userId, botId)

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

    const userKey = buildUserKey(botId, userId)
    const timeoutPromise = this._createTimeoutPromise(botId, userKey)
    const donePromise = this._createDonePromise(botId, userKey)

    await this.eventEngine.sendEvent(incomingEvent)

    return Promise.race([timeoutPromise, donePromise]).finally(() => {
      converseApiEvents.removeAllListeners(`done.${userKey}`)
      converseApiEvents.removeAllListeners(`action.start.${userKey}`)
      converseApiEvents.removeAllListeners(`action.end.${userKey}`)
      delete this._responseMap[userKey]
    })
  }

  private async _createDonePromise(botId, userKey: string) {
    return new Promise((resolve, reject) => {
      converseApiEvents.once(`done.${userKey}`, async event => {
        // We need to wait for an empty and not locked outgoing queue in order to have all responses
        await new Promise((resolve, reject) => {
          const resolveOnEmptyQueue = () => {
            this.eventEngine.isOutgoingQueueEmpty(event) && !this.eventEngine.isOutgoingQueueLocked(event)
              ? resolve()
              : setTimeout(resolveOnEmptyQueue, 50)
          }
          resolveOnEmptyQueue()
        })

        let bufferDelay = _.get(await this.configProvider.getBotConfig(botId), 'converse.bufferDelayMs')

        if (!bufferDelay) {
          bufferDelay = _.get(await this.configProvider.getBotpressConfig(), 'converse.bufferDelayMs', 250)
        }

        await Promise.delay(bufferDelay)
        if (this._responseMap[userKey]) {
          Object.assign(this._responseMap[userKey], <ResponseMap>{
            state: event.state,
            suggestions: event.suggestions,
            decision: event.decision || {}
          })
          return resolve(this._responseMap[userKey])
        } else {
          return reject(new Error(`No responses found for event target "${event.target}".`))
        }
      })
    })
  }

  private async _createTimeoutPromise(botId, userId) {
    let timeout = _.get(await this.configProvider.getBotConfig(botId), 'converse.timeout')
    if (!timeout) {
      timeout = _.get(await this.configProvider.getBotpressConfig(), 'converse.timeout', '5s')
    }

    const timeoutInMs = ms(timeout as string)

    let actionRunning = false

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // We deactivate the timeout for actions because they have their own timeout check
        if (!actionRunning) {
          reject(new Error('Request timed out.'))
        }
      }, timeoutInMs)

      converseApiEvents.on(`action.start.${userId}`, () => {
        actionRunning = true
      })

      converseApiEvents.on(`action.end.${userId}`, () => {
        actionRunning = false
        timer.refresh()
      })
    })
  }

  private _handleCapturePayload(event: IO.OutgoingEvent) {
    const userKey = buildUserKey(event.botId, event.target)
    if (!this._responseMap[userKey]) {
      this._responseMap[userKey] = { responses: [] }
    }

    this._responseMap[userKey].responses!.push(event.payload)
  }

  private _handleCaptureContext(event: IO.IncomingEvent) {
    const userKey = buildUserKey(event.botId, event.target)
    if (!this._responseMap[userKey]) {
      this._responseMap[userKey] = { responses: [] }
    }

    Object.assign(this._responseMap[userKey], <ResponseMap>{
      nlu: event.nlu || {},
      suggestions: event.suggestions || [],
      credentials: event.credentials
    })
  }
}
