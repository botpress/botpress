import { decodeFolderPath, UnexpectedError } from 'common/http'
import { FlowView } from 'common/typings'
import { MutexError } from 'core/dialog'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const parseFlowNameMiddleware = (req, _, next) => {
  const { flowName } = req.params
  if (flowName) {
    req.params.flowName = decodeFolderPath(flowName)
  }
  next()
}

export class FlowsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Flows', services)
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const flows = await this.flowService.forBot(botId).loadAll()
        res.send(flows)
      })
    )

    router.post(
      '/',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const flow = <FlowView>req.body.flow
        const userEmail = req.tokenUser!.email

        await this.flowService.forBot(botId).insertFlow(flow, userEmail)

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/:flowName',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      parseFlowNameMiddleware,
      this.asyncMiddleware(async (req, res) => {
        const { botId, flowName } = req.params
        const flow = <FlowView>req.body.flow
        const userEmail = req.tokenUser!.email

        if (_.has(flow, 'name') && flowName !== flow.name) {
          await this.flowService.forBot(botId).renameFlow(flowName, flow.name, userEmail)
          return res.sendStatus(200)
        }

        try {
          await this.flowService.forBot(botId).updateFlow(flow, userEmail)
          res.sendStatus(200)
        } catch (err) {
          if (err.type && err.type === MutexError.name) {
            return res.sendStatus(423) // Mutex locked
          }

          throw new UnexpectedError('Error saving flow', err)
        }
      })
    )

    this.router.post(
      '/:flowName/delete',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.flows'),
      parseFlowNameMiddleware,
      this.asyncMiddleware(async (req, res) => {
        const { botId, flowName } = req.params

        const userEmail = req.tokenUser!.email

        await this.flowService.forBot(botId).deleteFlow(flowName as string, userEmail)

        res.sendStatus(200)
      })
    )
  }
}
