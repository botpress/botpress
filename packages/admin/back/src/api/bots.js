import { Router } from 'express'

import { success, asyncMiddleware } from './common/reply'
import TeamService from '~/services/team'
import BotService from '~/services/bot'

export default ({ config, db }) => {
  const router = Router()
  const svc = TeamService({ config, db })
  const botSvc = BotService({ config, db })

  router.get(
    '/:botId/roles', // list bot team's roles
    asyncMiddleware(async (req, res) => {
      botSvc.assertBotAuth(req)
      botSvc.assertBotId(req, req.params.botId)

      const bot = await db.models.bot.findOne({
        where: {
          publicId: req.params.botId
        },
        attributes: ['teamId']
      })

      const roles = await svc.listTeamRoles(bot.teamId)
      return success(res)('Retrieved team roles', roles)
    })
  )

  return router
}
