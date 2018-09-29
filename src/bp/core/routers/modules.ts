import { Router } from 'express'

import { ModuleLoader } from '../module-loader'

import { CustomRouter } from '.'

export class ModulesRouter implements CustomRouter {
  public readonly router: Router

  constructor(private moduleLoader: ModuleLoader) {
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
  }
}
