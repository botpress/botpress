import { AdminServices } from 'admin/admin-router'
import { CustomAdminRouter } from 'admin/utils/customAdminRouter'
import diag from 'diag'
import fse from 'fs-extra'
import _ from 'lodash'
import { tmpNameSync } from 'tmp'
import yn from 'yn'

class ChecklistRouter extends CustomAdminRouter {
  constructor(services: AdminServices) {
    super('Checklist', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
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
            'BP_REDIS_SCOPE',
            'EXTERNAL_URL',
            'DATABASE_URL',
            'BP_PRODUCTION',
            'CLUSTER_ENABLED',
            'AUTO_MIGRATE',
            'BP_LICENSE_KEY',
            'BP_CONFIG_PRO_ENABLED',
            'BP_CONFIG_PRO_LICENSEKEY'
          ])
        }
        res.send(serverConfig)
      })
    )

    this.router.get(
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
  }
}

export default ChecklistRouter
