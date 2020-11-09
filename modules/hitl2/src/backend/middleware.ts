import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'

import { EscalationType } from './../types'
import { measure } from './helpers'
import { StateType } from './index'
import Repository from './repository'
import Socket from './socket'

const debug = DEBUG('hitl2')

const registerMiddleware = async (bp: typeof sdk, state: StateType) => {
  const realtime = Socket(bp)
  const repository = new Repository(bp)
  const cache = new LRU<string, string>({ max: 1000, maxAge: 1000 * 60 * 60 * 24 }) // 1 day

  const pipeEvent = async (event: sdk.IO.IncomingEvent, target: string, threadId: string) => {
    debug.forBot(event.botId, 'Piping event', { threadId, target })
    return bp.events.sendEvent(
      bp.IO.Event({
        botId: event.botId,
        target,
        threadId,
        channel: event.channel,
        direction: 'outgoing',
        type: event.type,
        payload: event.payload
      })
    )
  }

  const cacheKey = (a, b) => _.join([a, b], '.')

  const getEscalation = (cache, botId, threadId) => {
    return cache.get(cacheKey(botId, threadId))
  }

  const cacheEscalation = (botId: string, threadId: string, escalation: EscalationType) => {
    debug.forBot(botId, 'Caching escalation', { id: escalation.id, threadId })
    cache.set(cacheKey(botId, threadId), escalation.id)
  }

  const expireEscalation = (botId: string, threadId: string) => {
    debug.forBot(botId, 'Expiring escalation', { threadId })
    cache.del(cacheKey(botId, threadId))
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      return next()
    }

    // Either a pending or assigned escalation
    const escalationId = getEscalation(cache, event.botId, event.threadId)

    if (!escalationId) {
      next(undefined, false)
      return
    }

    const escalation = await repository.getEscalation(escalationId)

    // Handle incoming message from user
    if (escalation.userThreadId === event.threadId) {
      debug.forBot(event.botId, 'Handling message from User', { direction: event.direction, threadId: event.threadId })
      event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)

      if (escalation.status === 'assigned') {
        // There only is an agentId & agentThreadId after assignation
        await pipeEvent(event, escalation.agentId, escalation.agentThreadId)
      }

      // At this moment the event isn't persisted yet so an approximate
      // representation is built and sent to the frontend, which relies on
      // this to update the escalation's preview and read status.
      const partialEvent = {
        event: JSON.stringify(_.pick(event, ['preview'])),
        success: undefined,
        threadId: undefined,
        ..._.pick(event, ['id', 'direction', 'botId', 'channel', 'createdOn', 'threadId'])
      }

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: {
          ...escalation,
          userConversation: partialEvent
        }
      })

      realtime.sendPayload({
        resource: 'event',
        type: 'create',
        id: null,
        payload: partialEvent
      })

      // Handle incoming message from agent
    } else if (escalation.agentThreadId === event.threadId) {
      debug.forBot(event.botId, 'Handling message from Agent', { direction: event.direction, threadId: event.threadId })
      await pipeEvent(event, escalation.userId, escalation.userThreadId)
    }

    next()
  }

  // Performance: Eager load and cache escalations that will be required on every incoming message.
  // - Only escalations with status 'pending' or 'assigned' are cached because they are the only
  // ones for which the middleware handles agent <-> user event piping
  // - Escalations must be accessible both via their respective agent thread ID and user thread ID
  // for two-way message piping
  const warmup = () => {
    return repository
      .escalationsQuery(builder => {
        builder.where('status', 'pending').orWhere('status', 'assigned')
      })
      .then((escalations: EscalationType[]) => {
        escalations.forEach(escalation => {
          escalation.agentThreadId && cacheEscalation(escalation.botId, escalation.agentThreadId, escalation)
          escalation.userThreadId && cacheEscalation(escalation.botId, escalation.userThreadId, escalation)
        })
      })
  }

  await measure('cache-warmup', warmup(), items => {
    items.getEntries().forEach(entry => {
      debug('performance', _.pick(entry, 'name', 'duration'))
    })
  })

  state.cacheEscalation = await bp.distributed.broadcast(cacheEscalation)
  state.expireEscalation = await bp.distributed.broadcast(expireEscalation)


  bp.events.registerMiddleware({
    name: 'hitl2.incoming',
    direction: 'incoming',
    order: 0,
    description: 'Where magic happens',
    handler: incomingHandler
  })
}

const unregisterMiddleware = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitl2.incoming')
}

export { registerMiddleware, unregisterMiddleware }
