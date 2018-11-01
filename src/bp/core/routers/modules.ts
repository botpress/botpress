import { Router } from 'express'

import { ModuleLoader } from '../module-loader'
import { SkillService } from '../services/dialog/skill/service'

import { CustomRouter } from '.'
export class ModulesRouter implements CustomRouter {
  public readonly router: Router

  constructor(private moduleLoader: ModuleLoader, private skillService: SkillService) {
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get('/', async (req, res) => {
      res.json(this.moduleLoader.getLoadedModules())
    })

    this.router.get('/:moduleName/files', async (req, res, next) => {
      const { path: filePath } = req.query

      if (!filePath) {
        return next(new Error('Expected a file "path" defined'))
      }

      try {
        res.send(await this.moduleLoader.getModuleFile(req.params.moduleName, filePath))
      } catch (err) {
        next(err)
      }
    })

    this.router.post('/:moduleName/flow/:flowName/generate', async (req, res) => {
      const flowGenerator = await this.moduleLoader.getFlowGenerator(req.params.moduleName, req.params.flowName)

      if (!flowGenerator) {
        return res.status(404).send('Invalid module name or flow name')
      }

      try {
        res.send(await this.skillService.finalizeFlow(flowGenerator(req.body)))
      } catch (err) {
        res.status(400).send(`Error while trying to generate the flow: ${err}`)
      }
    })
  }
}
