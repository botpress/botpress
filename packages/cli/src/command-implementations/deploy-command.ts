import type * as bpclient from '@botpress/client'
import type * as bpsdk from '@botpress/sdk'
import chalk from 'chalk'
import * as fs from 'fs'
import { prepareUpdateBotBody } from '../api/bot-body'
import type { ApiClient } from '../api/client'
import { prepareUpdateIntegrationBody, CreateIntegrationBody } from '../api/integration-body'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { BuildCommand } from './build-command'
import { ProjectCommand } from './project-command'

export type DeployCommandDefinition = typeof commandDefinitions.deploy
export class DeployCommand extends ProjectCommand<DeployCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    if (api.url !== consts.defaultBotpressApiUrl) {
      this.logger.log(`Using custom url ${api.url}`)
    }

    if (!this.argv.noBuild) {
      await this._runBuild() // This ensures the bundle is always synced with source code
    }

    const integrationDef = await this.readIntegrationDefinitionFromFS()
    if (integrationDef) {
      return this._deployIntegration(api, integrationDef)
    }
    return this._deployBot(api, this.argv.botId, this.argv.createNewBot)
  }

  private async _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private async _deployIntegration(api: ApiClient, integrationDef: bpsdk.IntegrationDefinition) {
    const outfile = this.projectPaths.abs.outFile
    let code = await fs.promises.readFile(outfile, 'utf-8')

    const secrets = await this.promptSecrets(integrationDef, this.argv)
    // TODO: provide these secrets to the backend by API and remove this string replacement hack
    for (const [secretName, secretValue] of Object.entries(secrets)) {
      code = code.replace(new RegExp(`process\\.env\\.${secretName}`, 'g'), `"${secretValue}"`)
    }

    const { name, version, icon: iconRelativeFilePath, readme: readmeRelativeFilePath } = integrationDef

    const iconFileContent = await this._readMediaFile('icon', iconRelativeFilePath)
    const readmeFileContent = await this._readMediaFile('readme', readmeRelativeFilePath)

    const integration = await api.findIntegration({ type: 'name', name, version })

    let message: string
    if (integration) {
      this.logger.warn('Integration already exists. If you decide to deploy, it will overwrite the existing one.')
      message = `Are you sure you want to override integration ${integrationDef.name} v${integrationDef.version}?`
    } else {
      message = `Are you sure you want to deploy integration ${integrationDef.name} v${integrationDef.version}?`
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log('Aborted')
      return
    }

    const createBody: CreateIntegrationBody = {
      ...this.parseIntegrationDefinition(integrationDef),
      icon: iconFileContent,
      readme: readmeFileContent,
      code,
    }

    const line = this.logger.line()
    line.started(`Deploying integration ${chalk.bold(integrationDef.name)} v${integrationDef.version}...`)
    if (integration) {
      const updateBody = prepareUpdateIntegrationBody(
        {
          id: integration.id,
          ...createBody,
        },
        integration
      )

      await api.client.updateIntegration(updateBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not update integration "${integrationDef.name}"`)
      })
    } else {
      await api.client.createIntegration(createBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not create integration "${integrationDef.name}"`)
      })
    }
    line.success('Integration deployed')
  }

  private _readMediaFile = async (
    filePurpose: 'icon' | 'readme',
    filePath: string | undefined
  ): Promise<string | undefined> => {
    if (!filePath) {
      return undefined
    }

    const absoluteFilePath = utils.path.absoluteFrom(this.projectPaths.abs.workDir, filePath)
    return fs.promises.readFile(absoluteFilePath, 'base64').catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not read ${filePurpose} file "${absoluteFilePath}"`)
    })
  }

  private async _deployBot(api: ApiClient, argvBotId: string | undefined, argvCreateNew: boolean | undefined) {
    const outfile = this.projectPaths.abs.outFile
    const code = await fs.promises.readFile(outfile, 'utf-8')
    const { default: botImpl } = utils.require.requireJsFile<{ default: bpsdk.Bot }>(outfile)

    let bot: bpclient.Bot
    if (argvBotId && argvCreateNew) {
      throw new errors.BotpressCLIError('Cannot specify both --botId and --createNew')
    } else if (argvCreateNew) {
      const confirm = await this.prompt.confirm('Are you sure you want to create a new bot ?')
      if (!confirm) {
        this.logger.log('Aborted')
        return
      }

      bot = await this._createNewBot(api)
    } else {
      bot = await this._getExistingBot(api, argvBotId)

      const confirm = await this.prompt.confirm(`Are you sure you want to deploy the bot "${bot.name}"?`)
      if (!confirm) {
        this.logger.log('Aborted')
        return
      }
    }

    const line = this.logger.line()
    line.started(`Deploying bot ${chalk.bold(bot.name)}...`)

    const updateBotBody = prepareUpdateBotBody(
      {
        id: bot.id,
        code,
        ...this.parseBot(botImpl),
      },
      bot
    )

    const { bot: updatedBot } = await api.client.updateBot(updateBotBody).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not update bot "${bot.name}"`)
    })
    line.success('Bot deployed')
    this.displayWebhookUrls(updatedBot)
  }

  private async _createNewBot(api: ApiClient): Promise<bpclient.Bot> {
    const line = this.logger.line()
    const { bot: createdBot } = await api.client.createBot({}).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not create bot')
    })
    line.success(`Bot created with ID "${createdBot.id}" and name "${createdBot.name}"`)
    await this.projectCache.set('botId', createdBot.id)
    return createdBot
  }

  private async _getExistingBot(api: ApiClient, botId: string | undefined): Promise<bpclient.Bot> {
    const promptedBotId = await this.projectCache.sync('botId', botId, async (defaultId) => {
      const userBots = await api
        .listAllPages(api.client.listBots, (r) => r.bots)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not fetch existing bots')
        })

      if (!userBots.length) {
        throw new errors.NoBotsFoundError()
      }

      const initial = userBots.find((bot) => bot.id === defaultId)

      const prompted = await this.prompt.select('Which bot do you want to deploy?', {
        initial: initial && { title: initial.name, value: initial.id },
        choices: userBots.map((bot) => ({ title: bot.name, value: bot.id })),
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Bot Id')
      }

      return prompted
    })

    const { bot: fetchedBot } = await api.client.getBot({ id: promptedBotId }).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not get bot info')
    })

    return fetchedBot
  }
}
