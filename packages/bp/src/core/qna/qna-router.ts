import { Logger } from 'botpress/sdk'

import { CustomRouter } from 'core/routers/customRouter'
import { AuthService, TOKEN_AUDIENCE, checkTokenHeader, needPermissions } from 'core/security'
import { WorkspaceService } from 'core/users'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import { QnaService } from './qna-service'

export class QnaRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler
  private needPermissions: (operation: string, resource: string) => RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private workspaceService: WorkspaceService,
    private qnaService: QnaService
  ) {
    super('QNA', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.needPermissions = needPermissions(this.workspaceService)
    this.setupRoutes()
  }

  private setupRoutes(): void {
    const router = this.router

    router.post(
      '/intentActions',
      this.checkTokenHeader,
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const { intentName, event } = req.body

        try {
          res.send(await this.qnaService.getIntentActions(intentName, event))
        } catch (err) {
          this.logger.attachError(err).error(err.message)
          res.status(200).send([])
        }
      })
    )

    router.get(
      '/questions',
      this.checkTokenHeader,
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const {
          query: { question = '', filteredContexts = [], limit, offset }
        } = req

        const { items, count } = await this.qnaService.getQuestions(req.params.botId, {
          question,
          filteredContexts,
          limit: Number(limit),
          offset: Number(offset)
        })

        res.send({ items, count })
      })
    )

    router.get(
      '/questions/:id',
      this.checkTokenHeader,
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const question = await this.qnaService.getQuestion(req.params.id, req.params.botId)
        res.send(question)
      })
    )
  }
}
