import { Logger } from 'botpress/sdk'
import { Router } from 'express'

import { ModuleLoader } from '../module-loader'
import { SkillService } from '../services/dialog/skill/service'

import { CustomRouter } from './customRouter'

export class ModulesRouter extends CustomRouter {
  constructor(logger: Logger, private moduleLoader: ModuleLoader, private skillService: SkillService) {
    super('Modules', logger, Router({ mergeParams: true }))
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get('/', (req, res) => {
      res.json(this.moduleLoader.getLoadedModules())
    })

    this.router.get(
      '/botTemplates',
      this.asyncMiddleware(async (req, res, next) => {
        res.send(await this.moduleLoader.getBotTemplates())
      })
    )

    this.router.get(
      '/skills',
      this.asyncMiddleware(async (req, res, next) => {
        res.send(await this.moduleLoader.getAllSkills())
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
