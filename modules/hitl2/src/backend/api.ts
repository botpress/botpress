import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Request, Response } from 'express'
import Joi from 'joi'
import { boolean } from 'boolean'
import { v4 as uuidv4 } from 'uuid'

import { RequestWithUser } from 'common/typings'
import { BPRequest } from 'common/http'

import { StateType } from './index'
import { EscalationType, CommentType } from './../types'

import socket from './socket'
import { makeAgentId, formatError } from './helpers'
import { ResponseError, NotFoundError, UnprocessableEntityError } from './errors'
import {
  CreateCommentSchema,
  CreateEscalationSchema,
  AssignEscalationSchema,
  ResolveEscalationSchema,
  AgentOnlineValidation,
  escalationStatusRule
} from './validation'
import Repository, { AgentCollectionConditions, CollectionConditions } from './repository'

export default async (bp: typeof sdk, state: StateType) => {
  const router = bp.http.createRouterForBot('hitl2')
  const repository = new Repository(bp)
  const realtime = socket(bp)

  const hitlMiddleware = fn => {
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
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const payload = await repository.getCurrentAgent(req, req.params.botId, makeAgentId(strategy, email))
      res.json(payload)
    })
  )

  router.get(
    '/agents',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const agents = await repository.getAgents(
        req.params.botId,
        _.tap(_.pick(req.query, 'online'), conditions => {
          if (conditions.online) {
            conditions.online = boolean(conditions.online)
          }
        }) as AgentCollectionConditions
      )
      res.json(agents)
    })
  )

  router.post(
    '/agents/me/online',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const online = await repository.setAgentOnline(req.params.botId, agentId, true)
      const payload = {
        online: online
      }

      realtime.sendPayload({
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload: payload
      })

      res.json(payload)
    })
  )

  router.post(
    '/agents/me/offline',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
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

      res.json(payload)
    })
  )

  router.get(
    '/escalations',
    hitlMiddleware(async (req: Request, res: Response) => {
      const escalations = await repository.getEscalationsWithComments(
        req.params.botId,
        _.pick(req.query, ['limit', 'orderByColumn', 'orderByDirection']) as CollectionConditions
      )
      res.json(escalations)
    })
  )

  router.post(
    '/escalations',
    hitlMiddleware(async (req: Request, res: Response) => {
      const payload = {
        ..._.pick(req.body, ['userId', 'userThreadId']),
        status: 'pending' as 'pending'
      }

      Joi.attempt(payload, CreateEscalationSchema)

      // Prevent creating a new escalation if one is currently pending or assigned
      let escalation
      escalation = await repository
        .escalationsQuery(builder => {
          return builder
            .where('botId', req.params.botId)
            .andWhere('userId', payload.userId)
            .andWhere('userThreadId', payload.userThreadId)
            .whereNot('status', 'resolved')
            .orderBy('createdAt')
            .limit(1)
        })
        .then(data => _.head(data))

      if (escalation) {
        res.sendStatus(200)
      } else {
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

        res.status(201)
        res.json(escalation)
      }
    })
  )

  router.post(
    '/escalations/:id/assign',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)
      const online = await repository.getAgentOnline(req.params.botId, agentId)

      Joi.attempt({ online: online }, AgentOnlineValidation)

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
        escalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(e)
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload)

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

      res.json(escalation)
    })
  )

  router.post(
    '/escalations/:id/resolve',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)
      const online = await repository.getAgentOnline(req.params.botId, agentId)

      Joi.attempt({ online: online }, AgentOnlineValidation)

      let escalation
      escalation = await repository.getEscalationWithComments(req.params.botId, req.params.id)

      const payload: Partial<EscalationType> = {
        status: 'resolved',
        resolvedAt: new Date()
      }

      Joi.attempt(payload, ResolveEscalationSchema)

      try {
        escalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(e)
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload).then(escalation => {
        state.expireEscalation(req.params.botId, escalation.userThreadId)
        return escalation
      })

      realtime.sendPayload({
        resource: 'escalation',
        type: 'update',
        id: escalation.id,
        payload: escalation
      })

      res.json(escalation)
    })
  )

  router.post(
    '/escalations/:id/comments',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!

      const payload: CommentType = {
        ...req.body,
        escalationId: req.params.id,
        agentId: makeAgentId(strategy, email)
      }

      Joi.attempt(payload, CreateCommentSchema)

      const comment = await repository.createComment(payload)

      res.status(201)
      res.json(comment)
    })
  )
}
