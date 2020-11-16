import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'

import { IEscalation } from './../types'
import AgentSession from './agentSession'
import { measure } from './helpers'
import { StateType } from './index'
import Repository from './repository'
import Socket from './socket'

const registerMiddleware = async (bp: typeof sdk, state: StateType) => {
  const cache = new LRU<string, string>({ max: 1000, maxAge: 1000 * 60 * 60 * 24 }) // 1 day
  const repository = new Repository(bp)
  const realtime = Socket(bp)
  const { registerTimeout } = AgentSession(bp, repository, state.timeouts)

  const debug = DEBUG('hitl2')

  const pipeEvent = async (event: sdk.IO.IncomingEvent, eventDestination: sdk.IO.EventDestination) => {
    debug.forBot(event.botId, 'Piping event tp', eventDestination)
    return bp.events.replyToEvent(eventDestination, [{ type: 'typing', value: 10 }, event.payload])
  }

  const cacheKey = (a, b) => _.join([a, b], '.')

  const getEscalation = (cache, botId, threadId) => {
    return cache.get(cacheKey(botId, threadId))
  }

  const cacheEscalation = (botId: string, threadId: string, escalation: IEscalation) => {
    debug.forBot(botId, 'Caching escalation', { id: escalation.id, threadId })
    cache.set(cacheKey(botId, threadId), escalation.id)
  }

  const expireEscalation = (botId: string, threadId: string) => {
    debug.forBot(botId, 'Expiring escalation', { threadId })
    cache.del(cacheKey(botId, threadId))
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      // TODO we might want to handle other types
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

      if (escalation.status === 'assigned') {
        // There only is an agentId & agentThreadId after assignation
        await pipeEvent(event, {
          botId: escalation.botId,
          target: escalation.agentId,
          threadId: escalation.agentThreadId,
          channel: 'web'
        })
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

      realtime.sendPayload(event.botId, {
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: {
          ...escalation,
          userConversation: partialEvent
        }
      })

      realtime.sendPayload(event.botId, {
        resource: 'event',
        type: 'create',
        id: null,
        payload: partialEvent
      })

      // Handle incoming message from agent
    } else if (escalation.agentThreadId === event.threadId) {
      debug.forBot(event.botId, 'Handling message from Agent', { direction: event.direction, threadId: event.threadId })

      await pipeEvent(event, {
        botId: escalation.botId,
        threadId: escalation.userThreadId,
        target: escalation.userId,
        channel: escalation.userChannel
      })

      await repository.setAgentOnline(event.botId, escalation.agentId, true) // Bump agent session timeout
      await registerTimeout(event.botId, escalation.agentId).then(() => {
        debug.forBot(event.botId, 'Registering timeout', { agentId: escalation.agentId })
      })
    }

    // the session or bot is paused, swallow the message
    // TODO deprecate usage of isPause
    // @ts-ignore
    Object.assign(event, { isPause: true })

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
      .then((escalations: IEscalation[]) => {
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
    description: 'Where magic between users and agents happens',
    handler: incomingHandler
  })
}

const unregisterMiddleware = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitl2.incoming')
}

export { registerMiddleware, unregisterMiddleware }
