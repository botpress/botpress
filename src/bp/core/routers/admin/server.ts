import { Logger } from 'botpress/sdk'
import { ConfigProvider } from 'core/config/config-loader'
import { ModuleLoader } from 'core/module-loader'
import { GhostService } from 'core/services'
import { AlertingService } from 'core/services/alerting-service'
import { JobService } from 'core/services/job-service'
import { MonitoringService } from 'core/services/monitoring'
import { WorkspaceService } from 'core/services/workspace-service'
import diag from 'diag'
import { Router } from 'express'
import fse from 'fs-extra'
import _ from 'lodash'
import multer from 'multer'
import os from 'os'
import { tmpNameSync } from 'tmp'
import yn from 'yn'

import { getDebugScopes, setDebugScopes } from '../../../debug'
import { CustomRouter } from '../customRouter'
export class ServerRouter extends CustomRouter {
  private _rebootServer!: Function

  constructor(
    private logger: Logger,
    private monitoringService: MonitoringService,
    private alertingService: AlertingService,
    private configProvider: ConfigProvider,
    private ghostService: GhostService,
    private jobService: JobService,
    private moduleLoader: ModuleLoader
  ) {
    super('Server', logger, Router({ mergeParams: true }))
    // tslint:disable-next-line: no-floating-promises
    this.setupRoutes()
  }

  async setupRoutes() {
    const router = this.router

    router.post(
      '/monitoring',
      this.asyncMiddleware(async (req, res) => {
        const { fromTime, toTime } = req.body
        if (!_.isNumber(fromTime) || !_.isNumber(toTime)) {
          return res.sendStatus(400)
        }

        const config = await this.configProvider.getBotpressConfig()
        if (!_.get(config, 'pro.monitoring.enabled', false)) {
          return res.send(undefined)
        }

        res.send(await this.monitoringService.getStats(fromTime, toTime))
      })
    )

    router.post(
      '/incidents',
      this.asyncMiddleware(async (req, res) => {
        const { fromTime, toTime } = req.body
        if (!_.isNumber(fromTime) || !_.isNumber(toTime)) {
          return res.sendStatus(400)
        }

        const config = await this.configProvider.getBotpressConfig()
        if (!_.get(config, 'pro.alerting.enabled', false)) {
          return res.send(undefined)
        }

        res.send(await this.alertingService.getIncidents(fromTime, toTime))
      })
    )

    router.post(
      '/config/enablePro',
      this.asyncMiddleware(async (req, res) => {
        if (process.IS_PRO_ENABLED) {
          return res.send('Botpress Pro is already enabled.')
        }

        await this.configProvider.mergeBotpressConfig({ pro: { enabled: true } })
        res.send('Enabled successfully')
      })
    )

    router.post(
      '/rebootServer',
      this.asyncMiddleware(async (req, res) => {
        const user = req.tokenUser!.email
        const config = await this.configProvider.getBotpressConfig()

        if (!config.allowServerReboot) {
          this.logger.warn(`User ${user} requested a server reboot, but the feature is disabled.`)
          return res.status(400).send('Rebooting the server is disabled in the botpress.config.json file')
        }

        this.logger.info(`User ${user} requested a server reboot for ${req.query.hostname}`)

        await this._rebootServer(req.query.hostname)
        res.sendStatus(200)
      })
    )

    router.get(
      '/configHash',
      this.asyncMiddleware(async (req, res) => {
        res.send({
          initialHash: this.configProvider.initialConfigHash,
          currentHash: this.configProvider.currentConfigHash
        })
      })
    )

    router.get(
      '/debug',
      this.asyncMiddleware(async (req, res) => {
        res.send(getDebugScopes())
      })
    )

    router.post(
      '/debug',
      this.asyncMiddleware(async (req, res) => {
        const { debugScope, persist } = req.body

        if (persist) {
          await this.ghostService
            .global()
            .upsertFile('/', 'debug.json', JSON.stringify({ scopes: debugScope.split(',') }))
        }

        setDebugScopes(debugScope)
        res.sendStatus(200)
      })
    )

    router.get(
      '/serverConfig',
      this.asyncMiddleware(async (req, res) => {
        if (yn(process.core_env.BP_DISABLE_SERVER_CONFIG)) {
          return res.send(undefined)
        }

        const serverConfig = {
          config: await this.configProvider.getBotpressConfig(),
          live: _.pick(process, ['EXTERNAL_URL', 'ROOT_PATH', 'PROXY', 'APP_DATA_PATH', 'IS_LICENSED']),
          env: _.pick(process.core_env, [
            'BPFS_STORAGE',
            'PRO_ENABLED',
            'REDIS_URL',
            'EXTERNAL_URL',
            'DATABASE_URL',
            'BP_PRODUCTION',
            'CLUSTER_ENABLED',
            'AUTO_MIGRATE',
            'BP_LICENSE_KEY'
          ])
        }
        res.send(serverConfig)
      })
    )

    router.get(
      '/diag',
      this.asyncMiddleware(async (req, res) => {
        if (yn(process.core_env.BP_DISABLE_SERVER_DIAG)) {
          return res.send('Diagnostic report is disabled by the system administrator (BP_DISABLE_SERVER_DIAG)')
        }

        const tmpFile = tmpNameSync()
        await diag({ outputFile: tmpFile, noExit: true, config: true })
        res.send(await fse.readFile(tmpFile, 'utf-8'))
      })
    )

    router.post(
      '/features/enable/:featureId',
      this.asyncMiddleware(async (req, res) => {
        const { featureId } = req.params

        if (featureId === 'pro') {
          await this.configProvider.mergeBotpressConfig({ pro: { enabled: true } })
        } else if (featureId === 'monitoring') {
          await this.configProvider.mergeBotpressConfig({ pro: { monitoring: { enabled: true } } })
        } else if (featureId === 'alerting') {
          await this.configProvider.mergeBotpressConfig({ pro: { alerting: { enabled: true } } })
        }

        res.sendStatus(200)
      })
    )

    router.post('/modules/upload', multer().single('file'), async (req, res) => {
      const file = req['file'].buffer

      const moduleInfo = await this.moduleLoader.getArchiveModuleInfo(file)

      if (moduleInfo) {
        this.logger.info(`Uploaded module ${moduleInfo.name}`)
        await this.ghostService.root().upsertFile('modules', `${moduleInfo.name}.tgz`, file)
        return res.send(moduleInfo)
      }

      res.sendStatus(400)
    })

    this._rebootServer = await this.jobService.broadcast<void>(this.__local_rebootServer.bind(this))
  }

  private __local_rebootServer(hostname?: string) {
    if (!hostname || hostname === os.hostname()) {
      process.send!({ type: 'reboot_server' })
    }
  }
}
