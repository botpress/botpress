import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import { UnexpectedError } from 'common/http'
import { ModuleInfo } from 'common/typings'
import { ModuleResolver } from 'core/modules'
import { NotFoundError } from 'core/routers'
import { assertSuperAdmin } from 'core/security'
import _ from 'lodash'
import multer from 'multer'
import yn from 'yn'

class ModulesRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Modules', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.post(
      '/upload',
      assertSuperAdmin,
      multer().single('file'),
      this.asyncMiddleware(async (req, res) => {
        const file = req['file'].buffer

        const moduleInfo = await this.moduleLoader.getArchiveModuleInfo(file)

        if (moduleInfo) {
          this.logger.info(`Uploaded module ${moduleInfo.name}`)
          await this.bpfs.root().upsertFile('modules', `${moduleInfo.name}.tgz`, file)
          return res.send(moduleInfo)
        }

        res.sendStatus(400)
      })
    )

    this.router.post(
      '/:moduleName/unpack',
      this.asyncMiddleware(async (req, res) => {
        try {
          const moduleInfo = await this._findModule(req.params.moduleName)

          const resolver = new ModuleResolver(this.logger)
          await resolver.resolve(moduleInfo.location)

          res.sendStatus(200)
        } catch (err) {
          throw new UnexpectedError('Could not unpack module', err)
        }
      })
    )

    this.router.post(
      '/:moduleName/enabled/:enabled',
      this.asyncMiddleware(async (req, res) => {
        const { moduleName } = req.params
        const enabled = yn(req.params.enabled)

        const { location, fullPath } = await this._findModule(moduleName)

        const modules = (await this.configProvider.getBotpressConfig()).modules
        const module = modules.find(x => x.location === location)

        if (module) {
          module.enabled = enabled
        } else {
          modules.push({ location, enabled })
        }

        await this.configProvider.mergeBotpressConfig({ modules })

        // Hot reloading of module is not distributed for now
        if (!process.CLUSTER_ENABLED && !process.IS_PRODUCTION) {
          if (!enabled) {
            await this.moduleLoader.unloadModule(fullPath, moduleName)
          } else {
            await this.moduleLoader.reloadModule(fullPath, moduleName)
            this.logger.info(`Module ${moduleName} reloaded successfully!`)
          }
          return res.send({ rebootRequired: false })
        } else {
          return res.send({ rebootRequired: true })
        }
      })
    )

    this.router.get(
      '/:moduleName/reload',
      this.asyncMiddleware(async (req, res, _next) => {
        const moduleName = req.params.moduleName
        const config = await this.configProvider.getBotpressConfig()
        const module = config.modules.find(x => x.location.endsWith(moduleName))

        if (module) {
          await this.moduleLoader.reloadModule(module.location, moduleName)
          return res.sendStatus(200)
        }

        res.sendStatus(404)
      })
    )
  }

  private async _findModule(moduleName: string): Promise<ModuleInfo> {
    const allModules = await this.moduleLoader.getAllModules()
    const module = allModules.find(x => x.name === moduleName)

    if (!module) {
      throw new NotFoundError(`Could not find module ${moduleName}`)
    }

    return module
  }
}

export default ModulesRouter
