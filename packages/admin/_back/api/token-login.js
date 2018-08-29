import { Router } from 'express'
import Joi from 'joi'
import _ from 'lodash'

import { NotFoundError } from '~/errors'

import { validateRequestSchema } from './common/assert'
import { success, asyncMiddleware } from './common/reply'

import PairingService from '~/services/pairing'
import AuthenticationService from '~/services/authentication'
import TeamService from '~/services/team'

export default ({ config, db }) => {
  const authSvc = AuthenticationService({ config, db })
  const pairingSvc = PairingService({ config, db })
  const teamSvc = TeamService({ config, db })

  const router = Router()

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

  return router
}
