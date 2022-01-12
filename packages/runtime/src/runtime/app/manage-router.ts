import * as sdk from 'botpress/runtime-sdk'
import { Router } from 'express'

import { BotService } from '../bots'

import { HTTPServer } from './server'
import { CustomRouter } from './server-utils'

export class ManageRouter extends CustomRouter {
  constructor(private logger: sdk.Logger, private botService: BotService, private http: HTTPServer) {
    super('ManageRouter', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  public setupRoutes(): void {
    const router = this.router.use((req, res, next) => {
      if (!process.env.MANAGE_API_KEY || req.headers['x-api-key'] === process.env.MANAGE_API_KEY) {
        return next()
      }

      next(new Error('Invalid API Key'))
    })

    router.post(
      '/:botId/import',
      this.asyncMiddleware(async (req, res) => {
        if (!req.is('application/tar+gzip')) {
          return res.status(400).send('Bot should be imported from archive')
        }

        const buffers: any[] = []
        req.on('data', chunk => buffers.push(chunk))
        await Promise.fromCallback(cb => req.on('end', cb))

        await this.botService.importBot(req.params.botId, Buffer.concat(buffers), true)
        res.sendStatus(200)
      })
    )

    router.post(
      '/:botId/delete',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params

        await this.botService.deleteBot(botId)
        res.sendStatus(200)
      })
    )
  }
}
