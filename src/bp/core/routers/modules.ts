import { FlowGeneratorMetadata, Logger } from 'botpress/sdk'
import { ModuleInfo } from 'common/typings'
import { ConfigProvider } from 'core/config/config-loader'
import ModuleResolver from 'core/modules/resolver'
import AuthService, { TOKEN_AUDIENCE } from 'core/services/auth/auth-service'
import { RequestHandler, Router } from 'express'
import _ from 'lodash'
import path from 'path'
import yn from 'yn'

import { ModuleLoader } from '../module-loader'
import { SkillService } from '../services/dialog/skill/service'

import { CustomRouter } from './customRouter'
import { NotFoundError } from './errors'
import { assertSuperAdmin, checkTokenHeader } from './util'

const extractModuleInfo = ({ location, enabled }, resolver: ModuleResolver): ModuleInfo | undefined => {
  try {
    const status = resolver.getModuleInfo(location)
    if (!status || !status.valid) {
      return
    }

    const moduleInfo = {
      name: path.basename(location),
      fullPath: status.path,
      archived: status.archived,
      location,
      enabled
    }

    if (status.archived) {
      return moduleInfo
    }

    return {
      ...moduleInfo,
      ..._.pick(require(path.resolve(status.path, 'package.json')), ['name', 'fullName', 'description'])
    }
    // silent catch
  } catch (err) {}
}

export class ModulesRouter extends CustomRouter {
  private checkTokenHeader!: RequestHandler

  constructor(
    private logger: Logger,
    private authService: AuthService,
    private moduleLoader: ModuleLoader,
    private skillService: SkillService,
    private configProvider: ConfigProvider
  ) {
    super('Modules', logger, Router({ mergeParams: true }))
    this.checkTokenHeader = checkTokenHeader(this.authService, TOKEN_AUDIENCE)
    this.setupRoutes()
  }

  private setupRoutes(): void {
    this.router.get('/', (req, res) => {
      res.json(this.moduleLoader.getLoadedModules())
    })

    this.router.get(
      '/all',
      this.checkTokenHeader,
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        res.send(await this._getAllModules())
      })
    )

    this.router.post(
      '/:moduleName/unpack',
      this.checkTokenHeader,
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res) => {
        try {
          const moduleInfo = await this._findModule(req.params.moduleName)

          const resolver = new ModuleResolver(this.logger)
          await resolver.resolve(moduleInfo.location)

          res.sendStatus(200)
        } catch (err) {
          this.logger.attachError(err).error(`Could not unpack module`)
          res.sendStatus(500)
        }
      })
    )

    this.router.post(
      '/:moduleName/enabled/:enabled',
      this.checkTokenHeader,
      assertSuperAdmin,
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
          }
        }

        res.sendStatus(200)
      })
    )

    this.router.get(
      '/:moduleName/reload',
      this.checkTokenHeader,
      assertSuperAdmin,
      this.asyncMiddleware(async (req, res, next) => {
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

    this.router.get(
      '/botTemplates',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res, next) => {
        res.send(await this.moduleLoader.getBotTemplates())
      })
    )

    this.router.get(
      '/skills',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res, next) => {
        res.send(await this.moduleLoader.getAllSkills())
      })
    )

    this.router.post(
      '/:moduleName/skill/:skillId/generateFlow',
      this.checkTokenHeader,
      this.asyncMiddleware(async (req, res) => {
        const flowGenerator = this.moduleLoader.getFlowGenerator(req.params.moduleName, req.params.skillId)
        if (!flowGenerator) {
          return res.status(404).send('Invalid module name or flow name')
        }

        try {
          const metadata: FlowGeneratorMetadata = { botId: req.query.botId }
          res.send(this.skillService.finalizeFlow(await flowGenerator(req.body, metadata)))
        } catch (err) {
          res.status(400).send(`Error while trying to generate the flow: ${err}`)
        }
      })
    )
  }

  private async _getAllModules(): Promise<ModuleInfo[]> {
    const configModules = (await this.configProvider.getBotpressConfig()).modules

    // Add modules which are not listed in the config file
    const fileModules = await this.configProvider.getModulesListConfig()
    const missingModules = _.differenceBy(fileModules, configModules, 'location')

    const resolver = new ModuleResolver(this.logger)
    const allModules = await Promise.map([...configModules, ...missingModules], async mod =>
      extractModuleInfo(mod, resolver)
    )

    return _.orderBy(allModules.filter(Boolean), 'name') as ModuleInfo[]
  }

  private async _findModule(moduleName: string): Promise<ModuleInfo> {
    const allModules = await this._getAllModules()
    const module = allModules.find(x => x.name === moduleName)

    if (!module) {
      throw new NotFoundError(`Could not find module ${moduleName}`)
    }

    return module
  }
}
