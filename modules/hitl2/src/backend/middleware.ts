import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'

import { EscalationType } from './../types'
import { StateType } from './index'
import Repository from './repository'
import Socket from './socket'

const registerMiddleware = async (bp: typeof sdk, state: StateType) => {
  const realtime = Socket(bp)
  const repository = new Repository(bp)
  const cache = new LRU<string, string>({ max: 1000, maxAge: 1000 * 60 * 60 * 24 }) // 1 day

  const pipeEvent = async (event: sdk.IO.IncomingEvent, target: string, threadId: string) => {
    bp.events.sendEvent(
      bp.IO.Event({
        botId: event.botId,
        target: target,
        threadId: threadId,
        channel: event.channel,
        direction: 'outgoing',
        type: event.type,
        payload: event.payload
      })
    )
  }

  const getEscalation = (cache, botId, threadId) => {
    return cache.get(_.join([botId, threadId], '.'))
  }

  const cacheEscalation = async (botId: string, threadId: string, escalation: EscalationType) => {
    cache.set(_.join([botId, threadId], '.'), escalation.id)
  }

  const expireEscalation = async (botId: string, threadId: string) => {
    cache.del(_.join([botId, threadId], '.'))
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      return next()
    }

    const escalationId = getEscalation(cache, event.botId, event.threadId)

    // Only escalations with status 'pending' or 'assigned' are cached
    if (!escalationId) {
      next(undefined, false)
      return
    }

    const escalation = await repository.getEscalation(escalationId)

    // Handle incoming message from user
    if (escalation.userThreadId === event.threadId) {
      event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

      if (escalation.status === 'assigned') {
        // There only is an agentId & agentThreadId after assignation
        pipeEvent(event, escalation.agentId, escalation.agentThreadId)
      }

      // At this moment the event isn't persisted yet so an approximate
      // representation is built and sent to the frontend, which relies on
      // this to update the escalation's preview and read status.
      escalation.userConversation = {
        event: JSON.stringify(_.pick(event, ['preview'])),
        success: undefined,
        threadId: undefined,
        ..._.pick(event, ['id', 'direction', 'botId', 'channel', 'createdOn', 'threadId'])
      }

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })

      // Handle incoming message from agent
    } else if (escalation.agentThreadId === event.threadId) {
      pipeEvent(event, escalation.userId, escalation.userThreadId)
    }

    next()
  }

  const warmup = cache => {
    return repository
      .escalationsQuery(builder => {
        builder.where('status', 'pending').orWhere('status', 'assigned')
      })
      .then(escalations => {
        escalations.forEach(escalation => {
          cacheEscalation(escalation.botId, escalation.userThreadId, escalation)
        })
      })
      .then(() => bp.logger.debug('cache ----', cache.keys()))
  }

  state.cacheEscalation = await bp.distributed.broadcast(cacheEscalation)
  state.expireEscalation = await bp.distributed.broadcast(expireEscalation)

  warmup(cache)

  bp.events.registerMiddleware({
    name: 'hitl2.incoming',
    direction: 'incoming',
    order: 20,
    description: 'Where magic happens',
    handler: incomingHandler
  })
}

const unregisterMiddleware = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitl2.incoming')
}

export { registerMiddleware, unregisterMiddleware }
