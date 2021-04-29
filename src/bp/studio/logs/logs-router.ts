import _ from 'lodash'
import moment from 'moment'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class LogsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Logs', services)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.logs'),
      this.asyncMiddleware(async (req, res) => {
        const limit = req.query.limit
        const botId = req.params.botId
        const logs = await this.logsService.getLogsForBot(botId, limit)
        res.send(logs)
      })
    )

    router.get(
      '/archive',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.logs'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const logs = await this.logsService.getLogsForBot(botId)
        res.setHeader('Content-type', 'text/plain')
        res.setHeader('Content-disposition', 'attachment; filename=logs.txt')
        res.send(
          logs
            .map(({ timestamp, level, message }) => {
              const time = moment(new Date(timestamp)).format('MMM DD HH:mm:ss')
              return `${time} ${level}: ${message}`
            })
            .join('\n')
        )
      })
    )
  }
}
