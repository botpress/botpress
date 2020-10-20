import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'

import { EscalationType } from './../types'

import Socket from './socket'
import Repository from './repository'

const registerMiddleware = async (bp: typeof sdk) => {
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

  const getSetEscalation = async (
    cache: LRU<string, EscalationType>,
    botId: string,
    threadId: string
  ): Promise<EscalationType> => {
    let escalation
    escalation = cache.get(threadId)

    if (!escalation) {
      escalation = await repository
        .escalationsQuery(botId, builder => {
          return builder.andWhere('userThreadId', threadId).orWhere('agentThreadId', threadId)
        })
        .then(data => _.head(data))

      if (escalation) {
        cache.set(threadId, escalation)
      }
    }

    return escalation
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      return next()
    }

    const escalation = await getSetEscalation(cache, event.botId, event.threadId)

    if (!escalation) {
      next()
      return
    } else if (escalation.userThreadId === event.threadId) {
      // Handle incoming message from user
      if (escalation.status === 'assigned') {
        // There only is an agentId & agentThreadId after assignation
        await pipeEvent(event, escalation.agentId, escalation.agentThreadId)
      }

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })
    } else if (escalation.agentThreadId === event.threadId) {
      // Handle incoming message from agent
      await pipeEvent(event, escalation.target, escalation.userThreadId)
    }

    next(undefined, false)
  }

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
