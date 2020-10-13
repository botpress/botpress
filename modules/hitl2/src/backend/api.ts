import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import { Request, Response } from 'express'
import Joi from 'joi'

import { RequestWithUser } from 'common/typings'
import { BPRequest } from 'common/http'

import { EscalationType, CommentType } from './../types'

import socket from './socket'
import { makeAgentId, formatError } from './helpers'
import { ResponseError, NotFoundError, UnprocessableEntityError } from './errors'
import {
  CreateCommentSchema,
  CreateEscalationSchema,
  AssignEscalationSchema,
  ResolveEscalationSchema,
  AgentOnlineSchema,
  AgentOnlineValidation,
  escalationStatusRule
} from './validation'
import Repository from './repository'

export default async (bp: typeof sdk, state) => {
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
      const agents = await repository.getAgents(req.params.botId)
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

      realtime.send({
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload: payload
      })

      res.json(payload)
    })
  )

  router.delete(
    '/agents/me/online',
    hitlMiddleware(async (req: RequestWithUser, res: Response) => {
      const { email, strategy } = req.tokenUser!
      const agentId = makeAgentId(strategy, email)

      const online = await repository.setAgentOnline(req.params.botId, agentId, false)
      const payload = {
        online: online
      }

      realtime.send({
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
      const escalations = await repository.getEscalations(req.params.botId)
      res.json(escalations)
    })
  )

  router.post(
    '/escalations',
    hitlMiddleware(async (req: Request, res: Response) => {
      const payload = Object.assign(req.body, {
        botId: req.params.botId,
        status: 'pending'
      })

      Joi.attempt(payload, CreateEscalationSchema)

      const escalation = await repository.createEscalation(payload)

      realtime.send({
        resource: 'escalation',
        type: 'create',
        id: escalation.id,
        payload: escalation
      })

      res.json(escalation)
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
      escalation = await repository.getEscalation(req.params.id)

      const payload: Partial<EscalationType> = {
        agentId: agentId,
        status: 'assigned',
        assignedAt: new Date()
      }

      Joi.attempt(payload, AssignEscalationSchema)

      try {
        escalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(e)
      }

      escalation = await repository.updateEscalation(req.params.id, payload)

      realtime.send({
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
      escalation = await repository.getEscalation(req.params.id)

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

      escalation = await repository.updateEscalation(req.params.id, payload)

      realtime.send({
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

      res.json(comment)
    })
  )
}
