import { Logger } from 'botpress/sdk'
import { SpeechService } from 'core/services/speech/speech'
import { Router } from 'express'
import { CustomRouter } from './customRouter'

export class SpeechRouter extends CustomRouter {
  constructor(private logger: Logger, private speechService: SpeechService) {
    super('Speech', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get(
      '/speech',
      this.asyncMiddleware(async (req, res) => {
        const { file, lang } = req.query
        res.send({ text: await this.speechService.parse(file, lang) })
      })
    )
  }
}
