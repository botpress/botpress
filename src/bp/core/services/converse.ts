import Database from 'core/database'
import { UserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { InvalidParameterError } from 'errors'
import { EventEmitter2 } from 'eventemitter2'
import { inject, injectable, postConstruct } from 'inversify'
import _ from 'lodash'

import { Event } from '../sdk/impl'

import { EventEngine } from './middleware/event-engine'

export const converseApiEvents = new EventEmitter2({ maxListeners: 100 })

export class ConverseResponseBuilder {
  response: object[] = []
  state: object[] | undefined
  nlu: object[] | undefined

  addResponse(response): this {
    this.response.push(response)
    return this
  }

  clearResponses(): this {
    this.response = []
    return this
  }

  withState(state): this {
    this.state = state
    return this
  }

  withNlu(nlu): this {
    this.nlu = nlu
    return this
  }

  build() {
    let output = { response: this.response }
    if (this.nlu) {
      output = Object.assign({ nlu: this.nlu }, output)
    }
    if (this.state) {
      output = Object.assign({ state: this.state }, output)
    }
    return output
  }
}

@injectable()
export class ConverseService {
  // responsesPerEvent: Map<string, object[]> = new Map()
  responseBuilderMap: Map<string, ConverseResponseBuilder> = new Map()

  constructor(
    @inject(TYPES.Database) private db: Database,
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
        if (this.responseBuilderMap.has(event.target)) {
          const builder = this.responseBuilderMap.get(event.target) as ConverseResponseBuilder
          builder.addResponse(event.payload)
          event['state'] && builder.withState(event['state'])
          this.responseBuilderMap.set(event.target, builder)
        } else {
          this.responseBuilderMap.set(event.target, new ConverseResponseBuilder())
        }

        next()
      }
    })
    this.eventEngine.register({
      name: 'converse.capture.nlu',
      description: 'Captures the nlu output for the Converse API',
      order: 10000,
      direction: 'incoming',
      handler: (event, next) => {
        if (this.responseBuilderMap.has(event.target)) {
          const builder = this.responseBuilderMap.get(event.target) as ConverseResponseBuilder
          event['nlu'] && builder.withNlu(event['nlu'])
          this.responseBuilderMap.set(event.target, builder)
        } else {
          this.responseBuilderMap.set(event.target, new ConverseResponseBuilder())
        }

        next()
      }
    })
  }

  async sendMessage(botId: string, userId: string, payload): Promise<any> {
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

    const timeoutPromise = new Promise(resolve => {
      converseApiEvents.on('action.running', event => {
        if (event.target === userId) {
          // Ignore. Let the action run.
        } else {
          const wait = setTimeout(() => {
            clearTimeout(wait)
            // TODO: Use reject on donePromise and use a proper Error
            resolve({ error: 'Request timed out!' })
          }, 100)
        }
      })
    })
    const donePromise = new Promise(resolve => {
      converseApiEvents.on('done', event => {
        if (event.target === userId) {
          // const result = this.responsesPerEvent.get(res.target)
          const builder = this.responseBuilderMap.get(event.target) as ConverseResponseBuilder
          const response = builder.build()
          // const responseCopy = _.cloneDeep(response) // Complete copy. Not a reference
          // this.responseBuilderMap.delete(event.target)
          // return resolve(responseCopy)
          return resolve(response)
        }
      })
    })
    return Promise.race([timeoutPromise, donePromise])
  }
}
