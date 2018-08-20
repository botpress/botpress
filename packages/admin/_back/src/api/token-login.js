import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { NotFoundError } from '~/errors'

import { validateRequestSchema } from './common/assert'
import { success, error, asyncMiddleware } from './common/reply'
import util from './common/util'

import PairingService from '~/services/pairing'
import AuthenticationService from '~/services/authentication'
import TeamService from '~/services/team'

export default ({ config, db }) => {
  const authSvc = AuthenticationService({ config, db })
  const pairingSvc = PairingService({ config, db })
  const teamSvc = TeamService({ config, db })

  const router = Router()

  router.get(
    /^\/$|^\/myself$/i,
    asyncMiddleware(async (req, res) => {
      return success(res)(
        'Retrieved profile successfully',
        _.pick(req.dbUser, ['company', 'email', 'fullName', 'id', 'picture', 'provider', 'username'])
      )
    })
  )

  router.get(
    '/my-permissions/:teamId',
    asyncMiddleware(async (req, res) => {
      return success(res)(
        "Retrieved team member's permissions successfully",
        await teamSvc.getUserPermissions(req.dbUser.id, req.params.teamId)
      )
    })
  )

  router.get(
    '/bot/:botId/:env',
    asyncMiddleware(async (req, res) => {
      const bot = await pairingSvc.getBotByPublicId(req.params.botId)
      const { teamId } = bot

      await teamSvc.assertUserMember(req.dbUser.id, teamId)
      await teamSvc.assertUserPermission(req.dbUser.id, teamId, 'cloud.team.bots', 'read')

      const role = await teamSvc.getUserRole(req.dbUser.id, teamId)

      const botenv = await pairingSvc.getEnv({ botId: bot.id, env: req.params.env })
      const jwtToken = await authSvc.generateBotJWT(bot.publicId, { ...req.dbUser, role })

      return success(res)('Login successful', {
        action: 'login',
        token: jwtToken,
        botUrl: botenv.botUrl
      })
    })
  )

  router.get(
    '/redirect',
    asyncMiddleware(async (req, res) => {
      validateRequestSchema(
        'query',
        req,
        Joi.object().keys({
          botId: Joi.string()
            .trim()
            .required(),
          env: Joi.string()
            .trim()
            .min(2)
            .max(20)
            .alphanum()
            .required()
        })
      )

      const bot = await pairingSvc.getBotByPublicId(req.query.botId)
      const { teamId } = bot

      await teamSvc.assertUserMember(req.dbUser.id, teamId)
      await teamSvc.assertUserPermission(req.dbUser.id, teamId, 'cloud.team.bots', 'read')
      const role = await teamSvc.getUserRole(req.dbUser.id, teamId)

      const botenv = await pairingSvc.getEnv({ botId: bot.id, env: req.query.env })

      const jwtToken = await authSvc.generateBotJWT(req.query.botId, { ...req.dbUser, role })

      return success(res)('Login successful', {
        action: 'redirect',
        token: jwtToken,
        botUrl: botenv.botUrl
      })
    })
  )

  router.get(
    '/callback',
    asyncMiddleware(async (req, res) => {
      validateRequestSchema(
        'query',
        req,
        Joi.object().keys({
          botId: Joi.string()
            .trim()
            .required(),
          env: Joi.string()
            .trim()
            .min(2)
            .max(20)
            .alphanum()
            .required()
        })
      )

      const bot = await pairingSvc.getBotByPublicId(req.query.botId)
      const botenv = await pairingSvc.getEnv({ botId: bot.id, env: req.query.env })

      if (!bot || !botenv) {
        throw new NotFoundError(`Bot "${req.query.botId}" with env "${req.query.env}" not found`)
      }

      const identity = await authSvc.generateIdentityJWT(req.query.botId, req.dbUser)

      return success(res)('Login successful', {
        action: 'callback',
        identity: identity,
        botUrl: botenv.botUrl,
        botName: bot.name
      })
    })
  )

  router.get(
    '/cli',
    asyncMiddleware(async (req, res) => {
      validateRequestSchema(
        'query',
        req,
        Joi.object().keys({
          refresh: Joi.boolean().optional()
        })
      )
      const { cliToken, validUntil } = await authSvc.getOrCreateCliToken(req.dbUser.id, req.query.refresh)
      return success(res)('Generated CLI authentication token', { cliToken, validUntil })
    })
  )

  return router
}
