import { Logger } from 'botpress/sdk'
import { Router } from 'express'

import { ModuleLoader } from '../module-loader'
import { SkillService } from '../services/dialog/skill/service'

import { CustomRouter } from '.'
import { asyncMiddleware } from './util'

export class ModulesRouter implements CustomRouter {
  public readonly router: Router
  private asyncMiddleware!: Function

  constructor(logger: Logger, private moduleLoader: ModuleLoader, private skillService: SkillService) {
    this.asyncMiddleware = asyncMiddleware({ logger })
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get('/', async (req, res) => {
      res.json(this.moduleLoader.getLoadedModules())
    })

    this.router.get(
      '/skills',
      this.asyncMiddleware(async (req, res, next) => {
        try {
          res.send(await this.moduleLoader.getAllSkills())
        } catch (err) {
          next(err)
        }
      })
    )

    this.router.post(
      '/:moduleName/skill/:skillId/generateFlow',
      this.asyncMiddleware(async (req, res) => {
        const flowGenerator = await this.moduleLoader.getFlowGenerator(req.params.moduleName, req.params.skillId)

        if (!flowGenerator) {
          return res.status(404).send('Invalid module name or flow name')
        }

        try {
          res.send(await this.skillService.finalizeFlow(flowGenerator(req.body)))
        } catch (err) {
          res.status(400).send(`Error while trying to generate the flow: ${err}`)
        }
      })
    )
  }
}
