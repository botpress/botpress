import * as sdk from 'botpress/sdk'
import _ from 'lodash'

import { Config } from '../config'
import { MODULE_NAME } from '../constants'
import { ExitTypes, IHandoff, ISocketMessage } from '../types'
import { StateType } from '.'
import Repository from './repository'

export const toEventDestination = (
  botId: string,
  handoff: Pick<IHandoff, 'userId' | 'userThreadId' | 'userChannel'>
): sdk.IO.EventDestination => {
  return { botId, target: handoff.userId, threadId: handoff.userThreadId, channel: handoff.userChannel }
}

interface Realtime {
  sendPayload: (botId: string, message: ISocketMessage) => void
}

class Service {
  constructor(
    private bp: typeof sdk,
    private state: StateType,
    private repository: Repository,
    private realtime: Realtime
  ) {}

  async createHandoff(
    botId: string,
    dest: Pick<IHandoff, 'userId' | 'userThreadId' | 'userChannel' | 'status'>,
    timeoutDelay: number
  ) {
    const config: Config = await this.bp.config.getModuleConfigForBot(MODULE_NAME, botId)
    const eventDestination = toEventDestination(botId, dest)
    const attributes = await this.bp.users.getAttributes(dest.userChannel, dest.userId)
    const language = attributes.language

    const handoff = await this.repository.createHandoff(botId, dest).then(handoff => {
      this.state.cacheHandoff(botId, handoff.userThreadId, handoff)
      return handoff
    })

    if (config.transferMessage) {
      await this.sendMessageToUser(config.transferMessage, eventDestination, language)
    }

    this.realtime.sendPayload(botId, { resource: 'handoff', type: 'create', id: handoff.id, payload: handoff })

    if (timeoutDelay !== undefined && timeoutDelay > 0) {
      setTimeout(async () => {
        const userHandoff = await this.repository.getHandoff(handoff.id)

        if (userHandoff.status === 'pending') {
          await this.updateHandoff(userHandoff, botId, { status: 'expired' })
          await this.transferToBot(eventDestination, 'timedOutWaitingAgent')
        }
      }, timeoutDelay * 1000)
    }

    return handoff
  }

  async resolveHandoff(handoff: IHandoff, botId: string, payload) {
    const eventDestination = toEventDestination(botId, handoff)
    const updated = await this.updateHandoff(handoff, botId, payload)
    await this.transferToBot(eventDestination, 'handoffResolved')

    return updated
  }

  async updateHandoff(handoff: Partial<IHandoff>, botId: string, payload: any) {
    const updated = await this.repository.updateHandoff(botId, handoff.id, payload)
    this.state.expireHandoff(botId, handoff.userThreadId)
    this.updateRealtimeHandoff(botId, updated)

    return updated
  }

  async sendMessageToUser(
    text: { [lang: string]: string },
    eventDestination: sdk.IO.EventDestination,
    language: string,
    args?: any
  ) {
    const event = { state: { user: { language } } }
    const message = await this.bp.cms.renderElement(
      '@builtin_text',
      { type: 'text', text, event, ...args },
      eventDestination
    )
    this.bp.events.replyToEvent(eventDestination, message)
  }

  updateRealtimeHandoff(botId: string, handoff: Partial<IHandoff>) {
    return this.realtime.sendPayload(botId, { resource: 'handoff', type: 'update', id: handoff.id, payload: handoff })
  }

  async transferToBot(event: sdk.IO.EventDestination, exitType: ExitTypes, agentName?: string) {
    const stateUpdate = this.bp.IO.Event({
      ..._.pick(event, ['botId', 'channel', 'target', 'threadId']),
      direction: 'incoming',
      payload: { exitType, agentName },
      preview: 'none',
      type: 'hitlnext'
    })

    await this.bp.events.sendEvent(stateUpdate)
  }
}

export default Service
