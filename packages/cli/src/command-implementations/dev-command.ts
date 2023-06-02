import type * as bpclient from '@botpress/client'
import type { Bot as BotImpl, IntegrationDefinition } from '@botpress/sdk'
import chalk from 'chalk'
import * as pathlib from 'path'
import type { ApiClient } from '../api-client'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as utils from '../utils'
import { Worker } from '../worker'
import { BuildCommand } from './build-command'
import { ProjectCommand } from './project-command'
export type DevCommandDefinition = typeof commandDefinitions.dev
export class DevCommand extends ProjectCommand<DevCommandDefinition> {
  public async run(): Promise<void> {
    this.logger.warn('This command is experimental and subject to breaking changes without notice.')

    if (!this.argv.noBuild) {
      await this._runBuild() // This ensures the bundle is always synced with source code
    }

    const api = await this.ensureLoginAndCreateClient(this.argv)

    const integrationDef = await this.readIntegrationDefinitionFromFS()

    let env: Record<string, string> = {
      BP_API_URL: api.host,
      BP_TOKEN: api.token,
    }

    if (integrationDef) {
      await this._deployDevIntegration(api, this.argv.url, integrationDef)
      const secrets = await this.promptSecrets(integrationDef, this.argv)
      env = { ...env, ...secrets }
    } else {
      await this._deployDevBot(api, this.argv.url)
    }

    const outfile = this.projectPaths.abs.outFile
    const importPath = utils.path.toUnix(outfile)
    const requireFrom = utils.path.rmExtension(importPath)
    const code = `require('${requireFrom}').default.start(${this.argv.port})`
    const worker = await Worker.spawn(
      {
        type: 'code',
        code,
        env,
      },
      this.logger
    ).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not start dev worker')
    })

    try {
      const watcher = await utils.filewatcher.FileWatcher.watch(
        this.argv.workDir,
        async (events) => {
          const typescriptEvents = events.filter((e) => pathlib.extname(e.path) === '.ts')
          if (typescriptEvents.length === 0) {
            return
          }

          this.logger.log('Changes detected, reloading...')
          await this._runBuild()
          await worker.reload()
        },
        { ignore: [this.projectPaths.abs.outDir] }
      )

      await Promise.race([worker.wait(), watcher.wait()])
      await watcher.close()
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'An error occurred while running the dev worker')
    } finally {
      if (worker.running) {
        await worker.kill()
      }
    }
  }

  private _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private async _deployDevIntegration(
    api: ApiClient,
    externalUrl: string,
    integrationDef: IntegrationDefinition
  ): Promise<void> {
    const devId = await this.projectCache.get('devId')

    let integration: bpclient.Integration | undefined = undefined

    if (devId) {
      const resp = await api.client.getIntegration({ id: devId }).catch(async (thrown) => {
        const err = errors.BotpressCLIError.wrap(thrown, `Could not find existing dev integration with id "${devId}"`)
        this.logger.warn(err.message)
        return { integration: undefined }
      })

      if (resp.integration?.dev) {
        integration = resp.integration
      } else {
        await this.projectCache.rm('devId')
      }
    }

    const line = this.logger.line()
    line.started(`Deploying dev integration ${chalk.bold(integrationDef.name)}...`)
    if (integration) {
      const resp = await api.client
        .updateIntegration({ ...integrationDef, id: integration.id, url: externalUrl })
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not update dev integration "${integrationDef.name}"`)
        })
      integration = resp.integration
    } else {
      const resp = await api.client
        .createIntegration({ ...integrationDef, dev: true, url: externalUrl })
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not deploy dev integration "${integrationDef.name}"`)
        })
      integration = resp.integration
    }

    line.success(`Dev Integration deployed with id "${integration.id}"`)
    await this.projectCache.set('devId', integration.id)
  }

  private async _deployDevBot(api: ApiClient, externalUrl: string): Promise<void> {
    const devId = await this.projectCache.get('devId')

    let bot: bpclient.Bot | undefined = undefined

    if (devId) {
      const resp = await api.client.getBot({ id: devId }).catch(async (thrown) => {
        const err = errors.BotpressCLIError.wrap(thrown, `Could not find existing dev bot with id "${devId}"`)
        this.logger.warn(err.message)
        return { bot: undefined }
      })

      if (resp.bot?.dev) {
        bot = resp.bot
      } else {
        await this.projectCache.rm('devId')
      }
    }

    if (!bot) {
      const createLine = this.logger.line()
      createLine.started('Creating dev bot...')
      const resp = await api.client
        .createBot({
          dev: true,
          url: externalUrl,
        })
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not deploy dev bot')
        })

      bot = resp.bot
      createLine.success(`Dev Bot created with id "${bot.id}"`)
      await this.projectCache.set('devId', bot.id)
    }

    const outfile = this.projectPaths.abs.outFile
    const { default: botImpl } = utils.require.requireJsFile<{ default: BotImpl }>(outfile)

    const integrations = this.prepareIntegrations(botImpl, bot)

    const updateLine = this.logger.line()
    updateLine.started('Updating bot integrations...')

    const { bot: updatedBot } = await api.client
      .updateBot({ id: bot.id, integrations, url: externalUrl })
      .catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Could not deploy dev bot')
      })
    updateLine.success('Integrations installed successfully')

    this.displayWebhookUrls(updatedBot)
  }
}
