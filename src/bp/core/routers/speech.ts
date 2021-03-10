import { Logger } from 'botpress/sdk'
import { SpeechService } from 'core/services/speech'
import { Router } from 'express'
import { CustomRouter } from './customRouter'

export class SpeechRouter extends CustomRouter {
  constructor(private logger: Logger, private speechService: SpeechService) {
    super('Speech', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // todo : add security
    this.router.post(
      '/upload',
      this.asyncMiddleware(async (req, res) => {
        const { lang } = req.query
        res.send(await this.speechService.parse(req, lang))
      })
    )
  }
}
