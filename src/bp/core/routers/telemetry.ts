import * as sdk from 'botpress/sdk'
import { TelemetryRepository } from 'core/repositories/telemetry'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { RequestHandler, Router } from 'express'
import Joi from 'joi'

import { CustomRouter } from './customRouter'
import { checkTokenHeader } from './util'

export class TelemetryRouter extends CustomRouter {
  private checkTokenHeader: RequestHandler

  constructor(
    private logger: sdk.Logger,
    private authService: AuthService,
    private telemetryRepo: TelemetryRepository
  ) {
    super('Telemetry', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes() {
    // TODO get server header
    this.router.post(
      '/feedback',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const { success, events } = req.body

        await Joi.validate(
          req.body,
          Joi.object().keys({
            success: Joi.boolean().required(),
            events: Joi.array()
              .items(Joi.string())
              .required()
          })
        )

        success
          ? await this.telemetryRepo.removeMany(events)
          : await this.telemetryRepo.updateAvailability(events, true)
        res.sendStatus(200)
      })
    )

    this.router.get(
      '/events',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        try {
          const events = await this.telemetryRepo.getEntries()
          res.send(events)
        } catch (error) {
          this.logger.warn('Error extracting entries from Telemetry database')
          res.send([])
        }
      })
    )
  }
}
