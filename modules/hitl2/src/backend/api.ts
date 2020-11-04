import * as sdk from 'botpress/sdk'

import {
  AgentOnlineValidation,
  AssignEscalationSchema,
  CreateCommentSchema,
  CreateEscalationSchema,
  ResolveEscalationSchema,
  validateEscalationStatusRule
} from './validation'
import { CommentType, EscalationType } from './../types'
import Repository, { AgentCollectionConditions, CollectionConditions } from './repository'
import { Request, Response } from 'express'
import { ResponseError, UnprocessableEntityError } from './errors'
import { formatError, makeAgentId } from './helpers'

import { BPRequest } from 'common/http'
import Joi from 'joi'
import { RequestWithUser } from 'common/typings'
import { StateType } from './index'
import _ from 'lodash'
import socket from './socket'
import { v4 as uuidv4 } from 'uuid'
import yn from 'yn'

export default async (bp: typeof sdk, state: StateType) => {
  const router = bp.http.createRouterForBot('hitl2')
  const repository = new Repository(bp)
  const realtime = socket(bp)

  const agentOnlineMiddleware = async (req: BPRequest, res: Response, next) => {
    const { email, strategy } = req.tokenUser!
    const agentId = makeAgentId(strategy, email)
    const online = await repository.getAgentOnline(req.params.botId, agentId)

    try {
      Joi.attempt({ online: online }, AgentOnlineValidation)
    } catch (err) {
      if (err instanceof Joi.ValidationError) {
        return formatError(res, new UnprocessableEntityError(err))
      } else {
        return next(err)
      }
    }

    next()
  }

  const errorMiddleware = fn => {
    return (req: BPRequest, res: Response, next) => {
      Promise.resolve(fn(req as BPRequest, res, next)).catch(err => {
        if (err instanceof ResponseError) {
          formatError(res, err)
        } else if (err instanceof Joi.ValidationError) {
          formatError(res, new UnprocessableEntityError(err))
        } else {
          next(err)
        }
      })
    }
  }

  router.get(
    '/agents/me',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const payload = await repository.getCurrentAgent(req, req.params.botId, makeAgentId(strategy, email))
      res.send(payload)
    })
  )

  router.get(
    '/agents',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const agents = await repository.getAgents(
        req.params.botId,
        _.tap(_.pick(req.query, 'online'), conditions => {
          if (conditions.online) {
            conditions.online = yn(conditions.online)
          }
        }) as AgentCollectionConditions
      )
      res.send(agents)
    })
  )

  router.post(
    '/agents/me/online',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const online = await repository.setAgentOnline(req.params.botId, agentId, true)
      const payload = { online }

      realtime.sendPayload({
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload: payload
      })

      res.send(payload)
    })
  )

  router.post(
    '/agents/me/offline',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const online = await repository.setAgentOnline(req.params.botId, agentId, false)
      const payload = {
        online: online
      }

      realtime.sendPayload({
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload: payload
      })

      res.send(payload)
    })
  )

  router.get(
    '/escalations',
    errorMiddleware(async (req: Request, res: Response) => {
      const escalations = await repository.getEscalationsWithComments(
        req.params.botId,
        _.pick(req.query, ['limit', 'column', 'desc']) as CollectionConditions
      )
      res.send(escalations)
    })
  )

  router.post(
    '/escalations',
    errorMiddleware(async (req: Request, res: Response) => {
      const payload = {
        ..._.pick(req.body, ['userId', 'userThreadId']),
        status: 'pending' as 'pending'
      }

      Joi.attempt(payload, CreateEscalationSchema)

      // Prevent creating a new escalation if one is currently pending or assigned
      let escalation = await repository
        .escalationsQuery(builder => {
          return builder
            .where('botId', req.params.botId)
            .andWhere('userId', payload.userId)
            .andWhere('userThreadId', payload.userThreadId)
            .whereNot('status', 'resolved')
            .orderBy('createdAt')
            .limit(1)
        })
        .then(data => _.head(data) as EscalationType)

      if (escalation) {
        return res.sendStatus(200)
      }

      escalation = await repository.createEscalation(req.params.botId, payload).then(escalation => {
        state.cacheEscalation(req.params.botId, escalation.userThreadId, escalation)
        return escalation
      })

      realtime.sendPayload({
        resource: 'escalation',
        type: 'create',
        id: escalation.id,
        payload: escalation
      })

      res.status(201).send(escalation)
    })
  )

  router.post(
    '/escalations/:id/assign',
    agentOnlineMiddleware,
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)

      let escalation
      escalation = await repository.getEscalationWithComments(req.params.botId, req.params.id)

      const payload: Partial<EscalationType> = {
        agentId: agentId,
        agentThreadId: uuidv4(),
        assignedAt: new Date(),
        status: 'assigned'
      }

      Joi.attempt(payload, AssignEscalationSchema)

      try {
        validateEscalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(e)
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload)
      await repository.setAgentOnline(req.params.botId, agentId, true) // Bump agent session timeout

      // Find or create an "agent" user to send messages to
      const user = (await bp.users.getOrCreateUser('web', agentId, req.params.botId)).result

      // Initiate a conversation with agent
      await bp.events.sendEvent(
        bp.IO.Event({
          botId: req.params.botId,
          target: user.id,
          threadId: escalation.agentThreadId,
          channel: 'web',
          direction: 'outgoing',
          type: 'text',
          payload: {
            type: 'text', // type : history
            text: 'Start of escalation discussion' // custom component data
          }
        })
      )

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })

      res.send(escalation)
    })
  )

  router.post(
    '/escalations/:id/resolve',
    agentOnlineMiddleware,
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)


      let escalation
      escalation = await repository.getEscalationWithComments(req.params.botId, req.params.id)

      const payload: Partial<EscalationType> = {
        status: 'resolved',
        resolvedAt: new Date()
      }

      Joi.attempt(payload, ResolveEscalationSchema)

      try {
        validateEscalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(e)
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload).then(escalation => {
        state.expireEscalation(req.params.botId, escalation.userThreadId)
        return escalation
      })
      await repository.setAgentOnline(req.params.botId, agentId, true) // Bump agent session timeout

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })

      res.send(escalation)
    })
  )

  router.post(
    '/escalations/:id/comments',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const payload: CommentType = {
        ...req.body,
        escalationId: req.params.id,
        agentId: agentId
      }

      Joi.attempt(payload, CreateCommentSchema)

      const comment = await repository.createComment(payload)
      await repository.setAgentOnline(req.params.botId, agentId, true) // Bump agent session timeout

      res.status(201)
      res.send(comment)
    })
  )

  router.get(
    '/conversations/:id/messages',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      req.tokenUser!

      const messages = await repository.getMessages(req.params.botId, req.params.id)

      res.send(messages)
    })
  )
}
