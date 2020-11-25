import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import LRU from 'lru-cache'
import ms from 'ms'

import { Config } from '../config'
import { MODULE_NAME } from '../constants'

import { IHandoff } from './../types'
import { measure } from './helpers'
import { StateType } from './index'
import Repository from './repository'
import Socket from './socket'

const debug = DEBUG(MODULE_NAME)

const registerMiddleware = async (bp: typeof sdk, state: StateType) => {
  const cache = new LRU<string, string>({ max: 1000, maxAge: ms('1 day') })
  const repository = new Repository(bp, state.timeouts)
  const realtime = Socket(bp)

  const pipeEvent = async (event: sdk.IO.IncomingEvent, eventDestination: sdk.IO.EventDestination) => {
    debug.forBot(event.botId, 'Piping event', eventDestination)
    return bp.events.replyToEvent(eventDestination, [{ type: 'typing', value: 10 }, event.payload])
  }

  const cacheKey = (a, b) => [a, b].join('.')

  const getHandoff = (botId: string, threadId: string) => {
    return cache.get(cacheKey(botId, threadId))
  }

  const cacheHandoff = (botId: string, threadId: string, handoff: IHandoff) => {
    debug.forBot(botId, 'Caching handoff', { id: handoff.id, threadId })
    cache.set(cacheKey(botId, threadId), handoff.id)
  }

  const expireHandoff = (botId: string, threadId: string) => {
    debug.forBot(botId, 'Expiring handoff', { threadId })
    cache.del(cacheKey(botId, threadId))
  }

  const handleIncomingFromUser = async (handoff: IHandoff, event: sdk.IO.IncomingEvent) => {
    if (handoff.status === 'assigned') {
      // There only is an agentId & agentThreadId after assignation
      await pipeEvent(event, {
        botId: handoff.botId,
        target: handoff.agentId,
        threadId: handoff.agentThreadId,
        channel: 'web'
      })
    }

    // At this moment the event isn't persisted yet so an approximate
    // representation is built and sent to the frontend, which relies on
    // this to update the handoff's preview and read status.
    const partialEvent = {
      event: _.pick(event, ['preview']),
      success: undefined,
      threadId: undefined,
      ..._.pick(event, ['id', 'direction', 'botId', 'channel', 'createdOn', 'threadId'])
    }

    realtime.sendPayload(event.botId, {
      resource: 'handoff',
      type: 'update',
      id: handoff.id,
      payload: {
        ...handoff,
        userConversation: partialEvent
      }
    })

    realtime.sendPayload(event.botId, {
      resource: 'event',
      type: 'create',
      id: null,
      payload: partialEvent
    })
  }

  const handleIncomingFromAgent = async (handoff: IHandoff, event: sdk.IO.IncomingEvent) => {
    const { botAvatarUrl }: Config = await bp.config.getModuleConfigForBot(MODULE_NAME, event.botId)
    Object.assign(event.payload, {
      from: 'agent',
      botAvatarUrl
    }) // TODO set avatar url from agent profile if nothing in config

    await pipeEvent(event, {
      botId: handoff.botId,
      threadId: handoff.userThreadId,
      target: handoff.userId,
      channel: handoff.userChannel
    })

    await repository.setAgentOnline(event.botId, handoff.agentId, async () => {
      // By now the agent *should* be offline, but we check nonetheless
      const online = await repository.getAgentOnline(event.botId, handoff.agentId)
      const payload = {
        online
      }

      realtime.sendPayload(event.botId, {
        resource: 'agent',
        type: 'update',
        id: handoff.agentId,
        payload
      })
    })
  }

  const incomingHandler = async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
    if (event.type !== 'text') {
      // TODO we might want to handle other types
      return next()
    }

    // Either a pending or assigned handoff
    const handoffId = getHandoff(event.botId, event.threadId)

    if (!handoffId) {
      next(undefined, false)
      return
    }

    const handoff = await repository.getHandoff(handoffId)

    const incomingFromUser = handoff.userThreadId === event.threadId
    const incomingFromAgent = handoff.agentThreadId === event.threadId

    if (incomingFromUser) {
      debug.forBot(event.botId, 'Handling message from User', { direction: event.direction, threadId: event.threadId })
      handleIncomingFromUser(handoff, event)
    } else if (incomingFromAgent) {
      debug.forBot(event.botId, 'Handling message from Agent', { direction: event.direction, threadId: event.threadId })
      handleIncomingFromAgent(handoff, event)
    }

    // the session or bot is paused, swallow the message
    // TODO deprecate usage of isPause
    // @ts-ignore
    Object.assign(event, { isPause: true, handoffId: handoff.id })

    next()
  }

  // Performance: Eager load and cache handoffs that will be required on every incoming message.
  // - Only handoffs with status 'pending' or 'assigned' are cached because they are the only
  // ones for which the middleware handles agent <-> user event piping
  // - Handoffs must be accessible both via their respective agent thread ID and user thread ID
  // for two-way message piping
  const warmup = () => {
    return repository
      .handoffsQuery(builder => {
        builder.where('status', 'pending').orWhere('status', 'assigned')
      })
      .then((handoffs: IHandoff[]) => {
        handoffs.forEach(handoff => {
          handoff.agentThreadId && cacheHandoff(handoff.botId, handoff.agentThreadId, handoff)
          handoff.userThreadId && cacheHandoff(handoff.botId, handoff.userThreadId, handoff)
        })
      })
  }

  await measure('cache-warmup', warmup(), items => {
    items.getEntries().forEach(entry => {
      debug('performance', _.pick(entry, 'name', 'duration'))
    })
  })

  state.cacheHandoff = await bp.distributed.broadcast(cacheHandoff)
  state.expireHandoff = await bp.distributed.broadcast(expireHandoff)

  bp.events.registerMiddleware({
    name: 'hitlnext.incoming',
    direction: 'incoming',
    order: 0,
    description: 'Where magic between users and agents happens',
    handler: incomingHandler
  })
}

const unregisterMiddleware = async (bp: typeof sdk) => {
  bp.events.removeMiddleware('hitlnext.incoming')
}

export { registerMiddleware, unregisterMiddleware }
