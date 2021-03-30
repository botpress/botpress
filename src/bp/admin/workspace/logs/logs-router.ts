import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import _ from 'lodash'
import moment from 'moment'
import yn from 'yn'

class LogsRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Logs', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/',
      this.needPermissions('read', 'admin.logs'),
      this.asyncMiddleware(async (req, res) => {
        const { fromDate, toDate, onlyWorkspace } = req.query

        if (!fromDate || !toDate) {
          return res.status(400).send('fromDate and toDate must be specified')
        }

        const from = moment(parseInt(fromDate || ''))
        const to = moment(parseInt(toDate || ''))

        if (!from.isValid() || !to.isValid()) {
          return res.status(400).send('fromDate and toDate must be a valid unix timestamp')
        }

        let botIds
        if (!req.tokenUser?.isSuperAdmin || yn(onlyWorkspace)) {
          const botsRefs = await this.workspaceService.getBotRefs(req.workspace)
          botIds = (await this.botService.findBotsByIds(botsRefs)).filter(Boolean).map(x => x.id)
        }

        res.send(await this.logsRepository.searchLogs({ fromDate: from.toDate(), toDate: to.toDate(), botIds }))
      })
    )
  }
}

export default LogsRouter
