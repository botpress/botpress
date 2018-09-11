import { Router } from 'express'

import { LogsService } from '../services/logs/service'

import { CustomRouter } from '.'

export class LogsRouter implements CustomRouter {
  public readonly router: Router

  constructor(private logsService: LogsService) {
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  setupRoutes(): any {
    this.router.get('/', async (req, res) => {
      const limit = req.query.limit
      const logs = await this.logsService.getLogs(limit)
      res.send(logs)
    })
  }
}
