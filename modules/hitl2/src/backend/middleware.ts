import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'

import { StateType } from './index'
import { EscalationType } from './../types'

import Socket from './socket'
import Repository from './repository'

const registerMiddleware = async (bp: typeof sdk, state: StateType) => {
  const realtime = Socket(bp)
  const repository = new Repository(bp)
  const cache = new LRU<string, EscalationType>({ max: 100, maxAge: 60 * 60 * 24 }) // 1 day

  const pipeEvent = async (event: sdk.IO.IncomingEvent, targetUser: string, targetThread: string) => {
    await bp.events.sendEvent(
      bp.IO.Event({
        botId: event.botId,
        target: targetUser,
        threadId: targetThread,
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

  const setEscalation = async (cache, botId: string, threadId: string, escalation: EscalationType) => {
    cache.set(_.join([botId, threadId], '.'), escalation.id)
  }

  const unsetEscalation = async (cache, botId: string, threadId: string) => {
    cache.del(_.join([botId, threadId], '.'))
  }

  state.setEscalation = async (botId: string, threadId: string, escalation: EscalationType) => {
    const distributedSet = await bp.distributed.broadcast(setEscalation)
    distributedSet(cache, botId, threadId, escalation)
  }
  state.unsetEscalation = async (botId: string, threadId: string) => {
    const distributedUnset = await bp.distributed.broadcast(unsetEscalation)
    distributedUnset(cache, botId, threadId)
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      return next()
    }


    const escalationId = getEscalation(cache, event.botId, event.threadId)

    // Only escalations with status 'pending' or 'assigned' are cached
    if (!escalationId) {
      next(undefined, false, true)
      return
    }

    const escalation = await repository.getEscalationWithComments(event.botId, escalationId)

    if (escalation.userThreadId === event.threadId) {
      // Handle incoming message from user
      if (escalation.status === 'assigned') {
        // There only is an agentId & agentThreadId after assignation
        pipeEvent(event, escalation.agentId, escalation.agentThreadId)
      }

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })
    } else if (escalation.agentThreadId === event.threadId) {
      // Handle incoming message from agent
      pipeEvent(event, escalation.userId, escalation.userThreadId)
    }

    next()
  }

  const warmup = cache => {
    bp.logger.debug('warmup ----')
    repository
      .escalationsQuery(builder => {
        builder.where('status', 'pending').orWhere('status', 'assigned')
      })
      .then(escalations => {
        escalations.forEach(escalation => {
          setEscalation(cache, escalation.botId, escalation.userThreadId, escalation)
        })
      })
      .then(() => bp.logger.debug('cache ----', cache.keys()))
  }
  warmup(cache)
  bp.events.registerMiddleware({
    name: 'hitl.incoming',
    direction: 'incoming',
    order: 20,
    description: 'Where magic happens',
    handler: incomingHandler
  })
}

const unregisterMiddleware = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitl.incoming')
}

export { registerMiddleware, unregisterMiddleware }
