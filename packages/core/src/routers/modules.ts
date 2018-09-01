import { Router } from 'express'
import fs from 'fs-extra'
import path from 'path'

import { TYPES } from '../misc/types'
import { ModuleLoader } from '../module-loader'

import { CustomRouter } from '.'
import MODULES from './__modules'

export class ModulesRouter implements CustomRouter {
  public readonly router: Router

  constructor(private moduleLoader: ModuleLoader) {
    this.router = Router({ mergeParams: true })
    this.setupRoutes()
  }

  private setupRoutes(): void {
    // FIXME TODO Implement this properly
    this.router.get('/', async (req, res) => {
      res.json(MODULES)
    })

    this.router.get('/:moduleName/files', async (req, res, next) => {
      const { path: filePath } = req.query

      if (!filePath) {
        return next(new Error('Expected a file "path" defined'))
      }

      try {
        res.send(await this.moduleLoader.getModuleFile(req.params.moduleName, filePath))
      } catch (err) {
        res.sendStatus(404)
      }
    })
  }
}
