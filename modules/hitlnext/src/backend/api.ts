import Axios from 'axios'
import * as sdk from 'botpress/sdk'
import { BPRequest } from 'common/http'
import { RequestWithUser } from 'common/typings'
import { Request, Response } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { Config } from '../config'
import { MODULE_NAME } from '../constants'
import { agentName } from '../helper'

import { StateType } from './index'
import { HandoffStatus, IAgent, IComment, IHandoff } from './../types'
import { UnprocessableEntityError } from './errors'
import { extendAgentSession, formatValidationError, makeAgentId } from './helpers'
import Repository, { CollectionConditions } from './repository'
import Socket from './socket'
import {
  AgentOnlineValidation,
  AssignHandoffSchema,
  CreateCommentSchema,
  CreateHandoffSchema,
  ResolveHandoffSchema,
  UpdateHandoffSchema,
  validateHandoffStatusRule
} from './validation'

export default async (bp: typeof sdk, state: StateType, repository: Repository) => {
  const router = bp.http.createRouterForBot(MODULE_NAME)
  const realtime = Socket(bp)

  // Enforces for an agent to be 'online' before executing an action
  const agentOnlineMiddleware = async (req: BPRequest, res: Response, next) => {
    const { email, strategy } = req.tokenUser!
    const agentId = makeAgentId(strategy, email)
    const online = await repository.getAgentOnline(req.params.botId, agentId)

    try {
      Joi.attempt({ online }, AgentOnlineValidation)
    } catch (err) {
      if (err instanceof Joi.ValidationError) {
        return next(new UnprocessableEntityError(formatValidationError(err)))
      } else {
        return next(err)
      }
    }

    next()
  }

  // Catches exceptions and handles those that are expected
  const errorMiddleware = fn => {
    return (req: BPRequest, res: Response, next) => {
      Promise.resolve(fn(req as BPRequest, res, next)).catch(err => {
        if (err instanceof Joi.ValidationError) {
          throw new UnprocessableEntityError(formatValidationError(err))
        } else {
          next(err)
        }
      })
    }
  }

  // This should be available for all modules
  // The only thing we would need is a jsdoc comment @private on configs
  // we don't want to expose in some modules
  router.get(
    '/config',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const configs = await bp.config.getModuleConfigForBot(MODULE_NAME, req.params.botId)
      res.send(configs)
    })
  )

  router.get(
    '/agents/me',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const payload = await repository.getCurrentAgent(req as BPRequest, req.params.botId, makeAgentId(strategy, email))
      res.send(payload)
    })
  )

  router.get(
    '/agents',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const agents = await repository.listAgents(req.workspace).then(agents => {
        return Promise.map(agents, async agent => {
          return {
            ...agent,
            online: await repository.getAgentOnline(req.params.botId, agent.agentId)
          }
        })
      })

      res.send(agents)
    })
  )

  router.post(
    '/agents/me/online',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const { online } = req.body

      if (online) {
        await extendAgentSession(repository, realtime, req.params.botId, agentId)
      } else {
        await repository.unsetAgentOnline(req.params.botId, agentId)
      }

      const payload: Pick<IAgent, 'online'> = { online }

      realtime.sendPayload(req.params.botId, {
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload
      })

      res.send(payload)
    })
  )

  router.get(
    '/handoffs',
    errorMiddleware(async (req: Request, res: Response) => {
      const handoffs = await repository.listHandoffs(
        req.params.botId,
        _.pick<CollectionConditions>(req.query, ['limit', 'column', 'desc'])
      )
      res.send(handoffs)
    })
  )

  router.post(
    '/handoffs',
    errorMiddleware(async (req: Request, res: Response) => {
      const payload: Pick<IHandoff, 'userId' | 'userThreadId' | 'userChannel' | 'status'> = {
        ..._.pick(req.body, ['userId', 'userThreadId', 'userChannel']),
        status: <HandoffStatus>'pending'
      }

      Joi.attempt(payload, CreateHandoffSchema)

      // Prevent creating a new handoff if one for the same conversation is currently active
      const existing = await repository.existingActiveHandoff(
        req.params.botId,
        payload.userId,
        payload.userThreadId,
        payload.userChannel
      )

      if (existing) {
        return res.sendStatus(200)
      }

      const configs: Config = await bp.config.getModuleConfigForBot(MODULE_NAME, req.params.botId)

      const handoff = await repository.createHandoff(req.params.botId, payload).then(handoff => {
        state.cacheHandoff(req.params.botId, handoff.userThreadId, handoff)
        return handoff
      })

      const eventDestination = {
        botId: req.params.botId,
        target: handoff.userId,
        threadId: handoff.userThreadId,
        channel: handoff.userChannel
      }

      if (configs.transferMessage) {
        bp.events.replyToEvent(
          eventDestination,
          await bp.cms.renderElement('@builtin_text', { type: 'text', text: configs.transferMessage }, eventDestination)
        )
      }

      realtime.sendPayload(req.params.botId, {
        resource: 'handoff',
        type: 'create',
        id: handoff.id,
        payload: handoff
      })

      res.status(201).send(handoff)
    })
  )

  router.post(
    '/handoffs/:id',
    errorMiddleware(async (req: Request, res: Response) => {
      const { botId, id } = req.params
      const payload: Pick<IHandoff, 'tags'> = {
        ..._.pick(req.body, ['tags'])
      }

      Joi.attempt(payload, UpdateHandoffSchema)

      const handoff = await repository.updateHandoff(botId, id, payload)
      state.cacheHandoff(botId, handoff.userThreadId, handoff)

      realtime.sendPayload(botId, {
        resource: 'handoff',
        type: 'update',
        id: handoff.id,
        payload: handoff
      })

      res.send(handoff)
    })
  )

  router.post(
    '/handoffs/:id/assign',
    agentOnlineMiddleware,
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { botId } = req.params
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)
      const agent = await repository.getCurrentAgent(req as BPRequest, req.params.botId, agentId)

      let handoff = await repository.findHandoff(req.params.botId, req.params.id)

      const messaging = await repository.getMessagingClient(botId)
      const userId = await repository.mapVisitor(botId, agentId, messaging)
      const conversation = await messaging.conversations.create(userId)

      const agentThreadId = conversation.id
      const payload: Pick<IHandoff, 'agentId' | 'agentThreadId' | 'assignedAt' | 'status'> = {
        agentId,
        agentThreadId,
        assignedAt: new Date(),
        status: 'assigned'
      }
      Joi.attempt(payload, AssignHandoffSchema)

      try {
        validateHandoffStatusRule(handoff.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(formatValidationError(e))
      }

      handoff = await repository.updateHandoff(req.params.botId, req.params.id, payload)
      state.cacheHandoff(req.params.botId, agentThreadId, handoff)

      await extendAgentSession(repository, realtime, req.params.botId, agentId)

      const configs: Config = await bp.config.getModuleConfigForBot(MODULE_NAME, req.params.botId)

      if (configs.assignMessage) {
        const eventDestination = {
          botId: req.params.botId,
          target: handoff.userId,
          threadId: handoff.userThreadId,
          channel: handoff.userChannel
        }

        // TODO replace this by render service
        const assignedPayload = await bp.cms.renderElement(
          '@builtin_text',
          { type: 'text', text: configs.assignMessage, agentName: agentName(agent) },
          eventDestination
        )
        bp.events.replyToEvent(eventDestination, assignedPayload)
      }

      // TODO replace this by messaging api once all channels have been ported
      const recentUserConversationEvents = await bp.events.findEvents(
        { botId, threadId: handoff.userThreadId },
        { count: 10, sortOrder: [{ column: 'id', desc: true }] }
      )

      const baseEvent: Partial<sdk.IO.EventCtorArgs> = {
        direction: 'outgoing',
        channel: 'web',
        botId: handoff.botId,
        target: userId,
        threadId: handoff.agentThreadId
      }

      await Promise.mapSeries(recentUserConversationEvents.reverse(), event => {
        // @ts-ignore
        const e = bp.IO.Event({
          type: event.event.type,
          payload: event.event.payload,
          ...baseEvent
        } as sdk.IO.EventCtorArgs)
        return bp.events.sendEvent(e)
      })

      await bp.events.sendEvent(
        bp.IO.Event({
          ...baseEvent,
          type: 'custom',
          payload: {
            type: 'custom',
            module: MODULE_NAME,
            component: 'HandoffAssignedForAgent',
            noBubble: true,
            wrapped: { type: 'handoff' }
          }
        } as sdk.IO.EventCtorArgs)
      )

      realtime.sendPayload(req.params.botId, {
        resource: 'handoff',
        type: 'update',
        id: handoff.id,
        payload: handoff
      })

      res.send(handoff)
    })
  )

  router.post(
    '/handoffs/:id/resolve',
    agentOnlineMiddleware,
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)

      let handoff
      handoff = await repository.findHandoff(req.params.botId, req.params.id)

      const payload: Pick<IHandoff, 'status' | 'resolvedAt'> = {
        status: 'resolved',
        resolvedAt: new Date()
      }

      Joi.attempt(payload, ResolveHandoffSchema)

      try {
        validateHandoffStatusRule(handoff.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(formatValidationError(e))
      }

      handoff = await repository.updateHandoff(req.params.botId, req.params.id, payload).then(handoff => {
        state.expireHandoff(req.params.botId, handoff.userThreadId)
        return handoff
      })

      await extendAgentSession(repository, realtime, req.params.botId, agentId)

      realtime.sendPayload(req.params.botId, {
        resource: 'handoff',
        type: 'update',
        id: handoff.id,
        payload: handoff
      })

      res.send(handoff)
    })
  )

  router.post(
    '/handoffs/:id/comments',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const handoff = await repository.findHandoff(req.params.botId, req.params.id)

      const payload: Pick<IComment, 'content' | 'handoffId' | 'threadId' | 'agentId'> = {
        ...req.body,
        handoffId: handoff.id,
        threadId: handoff.userThreadId,
        agentId
      }

      Joi.attempt(payload, CreateCommentSchema)

      const comment = await repository.createComment(payload)
      handoff.comments = [...handoff.comments, comment]

      realtime.sendPayload(req.params.botId, {
        resource: 'handoff',
        type: 'update',
        id: handoff.id,
        payload: handoff
      })

      await extendAgentSession(repository, realtime, req.params.botId, agentId)

      res.status(201).send(comment)
    })
  )

  router.get(
    '/conversations/:id/messages',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      req.tokenUser!

      const messages = await repository.listMessages(
        req.params.botId,
        req.params.id,
        _.pick<CollectionConditions>(req.query, ['limit', 'column', 'desc'])
      )

      res.send(messages)
    })
  )
}
