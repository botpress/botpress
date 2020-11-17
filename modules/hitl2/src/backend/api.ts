import Axios from 'axios'
import * as sdk from 'botpress/sdk'
import { BPRequest } from 'common/http'
import { RequestWithUser } from 'common/typings'
import { Request, Response } from 'express'
import Joi from 'joi'
import _ from 'lodash'
import yn from 'yn'

import { EscalationType, IComment, IEscalation } from './../types'
import AgentSession from './agentSession'
import { UnauthorizedError, UnprocessableEntityError } from './errors'
import { formatValidationError, makeAgentId } from './helpers'
import { StateType } from './index'
import Repository, { AgentCollectionConditions, CollectionConditions } from './repository'
import Socket from './socket'
import {
  AgentOnlineValidation,
  AssignEscalationSchema,
  CreateCommentSchema,
  CreateEscalationSchema,
  ResolveEscalationSchema,
  validateEscalationStatusRule
} from './validation'

export default async (bp: typeof sdk, state: StateType) => {
  const router = bp.http.createRouterForBot('hitl2')
  const repository = new Repository(bp)
  const realtime = Socket(bp)
  const { registerTimeout, unregisterTimeout } = AgentSession(bp, repository, state.timeouts)

  const debug = DEBUG('hitl2')

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

  const licenseMiddleware = async (req: BPRequest, res: Response, next) => {
    if (!process.IS_PRO_ENABLED) {
      return next(new UnauthorizedError('Botpress Pro must be enabled'))
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

  router.use(licenseMiddleware)

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
      const agents = await repository.getAgents(
        req.params.botId,
        req.workspace,
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
      await registerTimeout(req.workspace, req.params.botId, agentId)

      const payload = { online }

      realtime.sendPayload(req.params.botId, {
        resource: 'agent',
        type: 'update',
        id: agentId,
        payload
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
      unregisterTimeout(req.workspace, req.params.botId, agentId)

      const payload = {
        online
      }

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
        ..._.pick(req.body, ['userId', 'userThreadId', 'userChannel']),
        status: <EscalationType>'pending'
      }

      Joi.attempt(payload, CreateEscalationSchema)

      // Prevent creating a new escalation if one is currently pending or assigned
      let escalation = await repository
        .escalationsQuery(builder => {
          return builder
            .where('botId', req.params.botId)
            .andWhere('userId', payload.userId)
            .andWhere('userThreadId', payload.userThreadId)
            .andWhere('userChannel', payload.userChannel)
            .whereNot('status', 'resolved')
            .orderBy('createdAt')
            .limit(1)
        })
        .then(data => _.head(data) as IEscalation)

      if (escalation) {
        return res.sendStatus(200)
      }

      escalation = await repository.createEscalation(req.params.botId, payload).then(escalation => {
        state.cacheEscalation(req.params.botId, escalation.userThreadId, escalation)
        return escalation
      })

      const eventDestination = {
        botId: req.params.botId,
        target: escalation.userId,
        threadId: escalation.userThreadId,
        channel: escalation.userChannel
      }

      bp.events.replyToEvent(
        eventDestination,
        await bp.cms.renderElement(
          'builtin_text',
          { type: 'text', text: 'You are being transfered to an agent.' },
          eventDestination
        )
      )

      realtime.sendPayload(req.params.botId, {
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
      const { botId } = req.params
      const { email, strategy } = req.tokenUser!

      const agentId = makeAgentId(strategy, email)

      let escalation: Partial<IEscalation> = await repository.getEscalationWithComments(req.params.botId, req.params.id)

      const axioxconfig = await bp.http.getAxiosConfigForBot(botId, { localUrl: true })
      const { data } = await Axios.post(`/mod/channel-web/conversations/${agentId}/new`, {}, axioxconfig)
      const agentThreadId = data.convoId.toString()
      const payload: Partial<IEscalation> = {
        agentId,
        agentThreadId,
        assignedAt: new Date(),
        status: 'assigned'
      }
      Joi.attempt(payload, AssignEscalationSchema)

      try {
        validateEscalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(formatValidationError(e))
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload)
      state.cacheEscalation(req.params.botId, agentThreadId, escalation)

      // Bump agent session timeout
      await repository.setAgentOnline(req.params.botId, agentId, true)
      await registerTimeout(req.workspace, req.params.botId, agentId)

      const eventDestination = {
        botId: req.params.botId,
        target: escalation.userId,
        threadId: escalation.userThreadId,
        channel: escalation.userChannel
      }

      bp.events.replyToEvent(
        eventDestination,
        await bp.cms.renderElement(
          'builtin_text',
          { type: 'text', text: 'You have been assigned to an agent.' },
          eventDestination
        )
      )

      bp.events.sendEvent(
        bp.IO.Event({
          botId: escalation.botId,
          target: escalation.agentId,
          channel: 'web',
          threadId: escalation.agentThreadId,
          direction: 'outgoing',
          type: 'custom',
          payload: {
            type: 'custom',
            module: 'hitl2',
            component: 'HandoffAssigned',
            noBubble: true,
            wrapped: {
              type: 'history' // super hack to make sure wrapper use our style, don't change
            }
          }
        })
      )

      realtime.sendPayload(req.params.botId, {
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

      const payload: Partial<IEscalation> = {
        status: 'resolved',
        resolvedAt: new Date()
      }

      Joi.attempt(payload, ResolveEscalationSchema)

      try {
        validateEscalationStatusRule(escalation.status, payload.status)
      } catch (e) {
        throw new UnprocessableEntityError(formatValidationError(e))
      }

      escalation = await repository.updateEscalation(req.params.botId, req.params.id, payload).then(escalation => {
        state.expireEscalation(req.params.botId, escalation.userThreadId)
        return escalation
      })

      await repository.setAgentOnline(req.params.botId, agentId, true) // Bump agent session timeout
      await registerTimeout(req.workspace, req.params.botId, agentId).then(() => {
        debug.forBot(req.params.botId, 'Registering timeout', { agentId })
      })

      realtime.sendPayload(req.params.botId, {
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

      const escalation = await repository.getEscalation(req.params.id)

      const payload: IComment = {
        ...req.body,
        escalationId: escalation.id,
        threadId: escalation.userThreadId,
        agentId
      }

      Joi.attempt(payload, CreateCommentSchema)

      const comment = await repository.createComment(payload)

      await repository.setAgentOnline(req.params.botId, agentId, true) // Bump agent session timeout
      await registerTimeout(req.workspace, req.params.botId, agentId).then(() => {
        debug.forBot(req.params.botId, 'Registering timeout', { agentId })
      })

      res.status(201)
      res.send(comment)
    })
  )

  router.get(
    '/conversations/:id/messages',
    errorMiddleware(async (req: RequestWithUser, res: Response) => {
      req.tokenUser!

      const messages = await repository.getMessages(
        req.params.botId,
        req.params.id,
        _.pick(req.query, ['limit', 'column', 'desc']) as CollectionConditions
      )

      res.send(messages)
    })
  )
}
