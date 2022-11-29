import Axios from 'axios'
import Bluebird from 'bluebird'
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
import { UnprocessableEntityError, UnauthorizedError } from './errors'
import { extendAgentSession, formatValidationError, makeAgentId } from './helpers'
import Repository, { CollectionConditions } from './repository'
import Service, { toEventDestination } from './service'
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

type HITLBPRequest = BPRequest & { agentId: string | undefined }

export default async (bp: typeof sdk, state: StateType, repository: Repository) => {
  const router = bp.http.createRouterForBot(MODULE_NAME)
  const realtime = Socket(bp)
  const service = new Service(bp, state, repository, realtime)

  // Enforces for an agent to be 'online' before executing an action
  const agentOnlineMiddleware = async (req: HITLBPRequest, res: Response, next) => {
    const { email, strategy } = req.tokenUser!
    const agentId = makeAgentId(strategy, email)
    const online = await repository.getAgentOnline(req.params.botId, agentId)

    try {
      Joi.attempt({ online }, AgentOnlineValidation)
      req.agentId = agentId
    } catch (err) {
      if (err instanceof Joi.ValidationError) {
        return next(new UnprocessableEntityError(formatValidationError(err)))
      } else {
        return next(err)
      }
    }

    next()
  }

  const hasPermission = (type: string, actionType: 'read' | 'write') => async (
    req: HITLBPRequest,
    res: Response,
    next
  ) => {
    const hasPermission = await bp.http.hasPermission(req, actionType, `module.hitlnext.${type}`, true)

    if (hasPermission) {
      return next()
    }

    return next(
      new UnauthorizedError(
        `user does not have sufficient permissions to "${actionType}" on resource "module.hitlnext.${type}"`
      )
    )
  }

  // Catches exceptions and handles those that are expected
  const errorMiddleware = fn => {
    return (req: BPRequest, res: Response, next) => {
      Promise.resolve(fn(req as BPRequest, res, next)).catch(err => {
        if (err instanceof Joi.ValidationError) {
          next(new UnprocessableEntityError(formatValidationError(err)))
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

      service.sendPayload(req.params.botId, {
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

      const handoff = await service.createHandoff(req.params.botId, payload, req.body.timeoutDelay)

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

      const handoff = await service.updateHandoff(id, botId, payload)

      service.sendPayload(botId, {
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

      const userId = await repository.mapVisitor(botId, agentId)
      const conversation = await bp.messaging.forBot(botId).createConversation(userId)

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
        const attributes = await bp.users.getAttributes(handoff.userChannel, handoff.userId)
        const language = attributes.language

        const eventDestination = toEventDestination(req.params.botId, handoff)

        await service.sendMessageToUser(configs.assignMessage, eventDestination, language, {
          agentName: agentName(agent)
        })
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

      await Promise.mapSeries(recentUserConversationEvents.reverse(), async event => {
        await bp.messaging
          .forBot(handoff.botId)
          .createMessage(
            handoff.agentThreadId,
            event.direction === 'incoming' ? undefined : event.target,
            event.event.payload
          )
        await Bluebird.delay(5)
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

      service.sendPayload(req.params.botId, {
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
    errorMiddleware(async (req: HITLBPRequest, res: Response) => {
      const handoff = await repository.findHandoff(req.params.botId, req.params.id)

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

      const updated = await service.resolveHandoff(handoff, req.params.botId, payload)
      req.agentId && (await extendAgentSession(repository, realtime, req.params.botId, req.agentId))

      res.send(updated)
    })
  )

  // Resolving -> can only occur after being assigned
  // Rejecting -> can only occur if pending or assigned
  router.post(
    '/handoffs/:id/reject',
    hasPermission('reject', 'write'),
    errorMiddleware(async (req: HITLBPRequest, res: Response) => {
      const handoff = await repository.findHandoff(req.params.botId, req.params.id)

      const payload: Pick<IHandoff, 'status' | 'resolvedAt'> = {
        status: 'rejected',
        resolvedAt: new Date()
      }

      Joi.attempt(payload, ResolveHandoffSchema)

      try {
        validateHandoffStatusRule(handoff.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(formatValidationError(e))
      }

      // Rejecting a handoff is the same as resolving it
      // But you can also transition from pending
      const updated = await service.resolveHandoff(handoff, req.params.botId, payload)

      res.send(updated)
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

      service.sendPayload(req.params.botId, {
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
