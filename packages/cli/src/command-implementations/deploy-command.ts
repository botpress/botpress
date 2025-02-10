import type * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import * as fs from 'fs'
import semver from 'semver'
import * as apiUtils from '../api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import * as tables from '../tables'
import * as utils from '../utils'
import { BuildCommand } from './build-command'
import { ProjectCommand } from './project-command'

export type DeployCommandDefinition = typeof commandDefinitions.deploy
export class DeployCommand extends ProjectCommand<DeployCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    if (!this.argv.noBuild) {
      await this._runBuild() // This ensures the bundle is always synced with source code
    }

    const projectDef = await this.readProjectDefinitionFromFS()

    if (projectDef.type === 'integration') {
      return this._deployIntegration(api, projectDef.definition)
    }
    if (projectDef.type === 'interface') {
      return this._deployInterface(api, projectDef.definition)
    }
    if (projectDef.type === 'plugin') {
      return this._deployPlugin(api, projectDef.definition)
    }
    if (projectDef.type === 'bot') {
      return this._deployBot(api, projectDef.definition, this.argv.botId, this.argv.createNewBot)
    }
    throw new errors.UnsupportedProjectType()
  }

  private async _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private async _deployIntegration(api: apiUtils.ApiClient, integrationDef: sdk.IntegrationDefinition) {
    const { integration: updatedIntegrationDef, workspaceId } = await this._manageWorkspaceHandle(api, integrationDef)
    integrationDef = updatedIntegrationDef
    if (workspaceId) {
      api = api.switchWorkspace(workspaceId)
    }

    const { name, version } = integrationDef

    if (integrationDef.icon && !integrationDef.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError('Icon must be an SVG file')
    }

    if (integrationDef.readme && !integrationDef.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError('Readme must be a Markdown file')
    }

    const integration = await api.findIntegration({ type: 'name', name, version })
    if (integration && integration.workspaceId !== api.workspaceId) {
      throw new errors.BotpressCLIError(
        `Public integration ${name} v${version} is already deployed in another workspace.`
      )
    }

    if (integration && integration.public && !api.isBotpressWorkspace) {
      throw new errors.BotpressCLIError(
        `Integration ${name} v${version} is already deployed publicly and cannot be updated. Please bump the version.`
      )
    }

    let message: string
    if (integration) {
      this.logger.warn('Integration already exists. If you decide to deploy, it will override the existing one.')
      message = `Are you sure you want to override integration ${name} v${version}?`
    } else {
      message = `Are you sure you want to deploy integration ${name} v${version}?`
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log('Aborted')
      return
    }

    this.logger.debug('Preparing integration request body...')

    const createBody = {
      ...(await this.prepareCreateIntegrationBody(integrationDef)),
      ...(await this.prepareIntegrationDependencies(integrationDef, api)),
      public: this.argv.public,
    }

    const startedMessage = `Deploying integration ${chalk.bold(name)} v${version}...`
    const successMessage = 'Integration deployed'
    if (integration) {
      const updateBody = apiUtils.prepareUpdateIntegrationBody(
        {
          id: integration.id,
          ...createBody,
        },
        integration
      )

      const { secrets: knownSecrets } = integration
      updateBody.secrets = await this.promptSecrets(integrationDef, this.argv, { knownSecrets })
      this._detectDeprecatedFeatures(integrationDef, { allowDeprecated: true })

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.log('Dry-run mode is active. Simulating integration update...')

        await api.client.validateIntegrationUpdate(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not update integration "${name}"`)
        })
      } else {
        await api.client.updateIntegration(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not update integration "${name}"`)
        })
      }

      line.success(successMessage)
    } else {
      this.logger.debug(`looking for previous version of integration "${name}"`)
      const previousVersion = await api.findPreviousIntegrationVersion({ type: 'name', name, version })

      if (previousVersion) {
        this.logger.debug(`previous version found: ${previousVersion.version}`)
      } else {
        this.logger.debug('no previous version found')
      }

      const knownSecrets = previousVersion?.secrets

      const createSecrets = await this.promptSecrets(integrationDef, this.argv, { knownSecrets })
      createBody.secrets = utils.records.filterValues(createSecrets, utils.guards.is.notNull)

      this._detectDeprecatedFeatures(integrationDef, {
        allowDeprecated: this._allowDeprecatedFeatures(integrationDef, previousVersion),
      })

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.log('Dry-run mode is active. Simulating integration creation...')

        await api.client.validateIntegrationCreation(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not create integration "${name}"`)
        })
      } else {
        await api.client.createIntegration(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not create integration "${name}"`)
        })
      }

      line.success(successMessage)
    }
  }

  private async _deployInterface(api: apiUtils.ApiClient, interfaceDeclaration: sdk.InterfaceDefinition) {
    if (!api.isBotpressWorkspace) {
      throw new errors.BotpressCLIError('Your workspace is not allowed to deploy interfaces.')
    }

    const { name, version } = interfaceDeclaration
    const intrface = await api.findPublicInterface({ type: 'name', name, version })

    let message: string
    if (intrface) {
      this.logger.warn('Interface already exists. If you decide to deploy, it will override the existing one.')
      message = `Are you sure you want to override interface ${name} v${version}?`
    } else {
      message = `Are you sure you want to deploy interface ${name} v${version}?`
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log('Aborted')
      return
    }

    const createBody = await apiUtils.prepareCreateInterfaceBody(interfaceDeclaration)

    const startedMessage = `Deploying interface ${chalk.bold(name)} v${version}...`
    const successMessage = 'Interface deployed'
    if (intrface) {
      const updateBody = apiUtils.prepareUpdateInterfaceBody(
        {
          id: intrface.id,
          ...createBody,
        },
        intrface
      )

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn('Dry-run mode is not supported for interface updates. Skipping deployment...')
      } else {
        await api.client.updateInterface(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not update interface "${name}"`)
        })
      }

      line.success(successMessage)
    } else {
      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn('Dry-run mode is not supported for interface creation. Skipping deployment...')
      } else {
        await api.client.createInterface(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not create interface "${name}"`)
        })
      }

      line.success(successMessage)
    }
  }

  private async _deployPlugin(api: apiUtils.ApiClient, pluginDef: sdk.PluginDefinition) {
    const codeCJS = await fs.promises.readFile(this.projectPaths.abs.outFileCJS, 'utf-8')
    const codeESM = await fs.promises.readFile(this.projectPaths.abs.outFileESM, 'utf-8')

    const { name, version } = pluginDef

    const plugin = await api.findPublicPlugin({ type: 'name', name, version })

    let message: string
    if (plugin) {
      this.logger.warn('Plugin already exists. If you decide to deploy, it will override the existing one.')
      message = `Are you sure you want to override plugin ${name} v${version}?`
    } else {
      message = `Are you sure you want to deploy plugin ${name} v${version}?`
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log('Aborted')
      return
    }

    this.logger.debug('Preparing plugin request body...')

    const createBody = {
      ...(await apiUtils.prepareCreatePluginBody(pluginDef)),
      ...(await this.preparePluginDependencies(pluginDef, api)),
      code: {
        node: codeCJS,
        browser: codeESM,
      },
    }

    const startedMessage = `Deploying plugin ${chalk.bold(name)} v${version}...`
    const successMessage = 'Plugin deployed'
    if (plugin) {
      const updateBody = apiUtils.prepareUpdatePluginBody(
        {
          id: plugin.id,
          ...createBody,
        },
        plugin
      )

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn('Dry-run mode is not supported for plugin updates. Skipping deployment...')
      } else {
        await api.client.updatePlugin(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not update plugin "${name}"`)
        })
      }

      line.success(successMessage)
    } else {
      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn('Dry-run mode is not supported for plugin creation. Skipping deployment...')
      } else {
        await api.client.createPlugin(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not create plugin "${name}"`)
        })
      }

      line.success(successMessage)
    }
  }

  private _allowDeprecatedFeatures(
    integrationDef: sdk.IntegrationDefinition,
    previousVersion: client.Integration | undefined
  ): boolean {
    if (this.argv.allowDeprecated) {
      return true
    }

    if (!previousVersion) {
      return false
    }

    const versionDiff = semver.diff(integrationDef.version, previousVersion.version)
    if (!versionDiff) {
      return false
    }

    return utils.semver.releases.lt(versionDiff, 'major')
  }

  private _detectDeprecatedFeatures(
    integrationDef: sdk.IntegrationDefinition,
    opts: { allowDeprecated?: boolean } = {}
  ) {
    const deprecatedFields: string[] = []
    const { user, channels } = integrationDef
    if (user?.creation?.enabled) {
      deprecatedFields.push('user.creation')
    }

    for (const [channelName, channel] of Object.entries(channels ?? {})) {
      if (channel?.conversation?.creation?.enabled) {
        deprecatedFields.push(`channels.${channelName}.creation`)
      }
    }

    if (!deprecatedFields.length) {
      return
    }

    const errorMessage = `The following fields of the integration's definition are deprecated: ${deprecatedFields.join(
      ', '
    )}`

    if (opts.allowDeprecated) {
      this.logger.warn(errorMessage)
    } else {
      throw new errors.BotpressCLIError(errorMessage)
    }
  }

  private async _deployBot(
    api: apiUtils.ApiClient,
    botDefinition: sdk.BotDefinition,
    argvBotId: string | undefined,
    argvCreateNew: boolean | undefined
  ) {
    if (this.argv.dryRun) {
      this.logger.warn('Dry-run mode is not supported for bot deployments. Skipping deployment...')
      return
    }

    const outfile = this.projectPaths.abs.outFileCJS
    const code = await fs.promises.readFile(outfile, 'utf-8')

    let bot: client.Bot
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

    const updateBotBody = apiUtils.prepareUpdateBotBody(
      {
        ...(await apiUtils.prepareCreateBotBody(botDefinition)),
        ...(await this.prepareBotDependencies(botDefinition, api)),
        id: bot.id,
        code,
      },
      bot
    )

    const { bot: updatedBot } = await api.client.updateBot(updateBotBody).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not update bot "${bot.name}"`)
    })

    const tablesPublisher = new tables.TablesPublisher({ api, logger: this.logger, prompt: this.prompt })
    await tablesPublisher.deployTables({ botId: updatedBot.id, botDefinition })

    line.success('Bot deployed')
    this.displayWebhookUrls(updatedBot)
  }

  private async _createNewBot(api: apiUtils.ApiClient): Promise<client.Bot> {
    const line = this.logger.line()
    const { bot: createdBot } = await api.client.createBot({}).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not create bot')
    })
    line.success(`Bot created with ID "${createdBot.id}" and name "${createdBot.name}"`)
    await this.projectCache.set('botId', createdBot.id)
    return createdBot
  }

  private async _getExistingBot(api: apiUtils.ApiClient, botId: string | undefined): Promise<client.Bot> {
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

  private async _manageWorkspaceHandle(
    api: apiUtils.ApiClient,
    integration: sdk.IntegrationDefinition
  ): Promise<{
    integration: sdk.IntegrationDefinition
    workspaceId?: string // Set if user opted to deploy on another available workspace
  }> {
    const { name: localName, workspaceHandle: localHandle } = this._parseIntegrationName(integration.name)
    if (!localHandle && api.isBotpressWorkspace) {
      this.logger.debug('Botpress workspace detected; workspace handle omitted')
      return { integration } // botpress has the right to omit workspace handle
    }

    const { handle: remoteHandle, name: workspaceName } = await api.getWorkspace().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not fetch workspace')
    })

    if (localHandle && remoteHandle) {
      let workspaceId: string | undefined = undefined
      if (localHandle !== remoteHandle) {
        const remoteWorkspace = await api.findWorkspaceByHandle(localHandle).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, 'Could not list workspaces')
        })
        if (!remoteWorkspace) {
          throw new errors.BotpressCLIError(
            `The integration handle "${localHandle}" is not associated with any of your workspaces.`
          )
        }
        this.logger.warn(
          `Your are logged in to workspace "${workspaceName}" but integration handle "${localHandle}" belongs to "${remoteWorkspace.name}".`
        )
        const confirmUseAlternateWorkspace = await this.prompt.confirm(
          'Do you want to deploy integration on this workspace instead?'
        )
        if (!confirmUseAlternateWorkspace) {
          throw new errors.BotpressCLIError(
            `Cannot deploy integration with handle "${localHandle}" on workspace "${workspaceName}"`
          )
        }

        workspaceId = remoteWorkspace.id
      }
      return { integration, workspaceId }
    }

    const workspaceHandleIsMandatoryMsg = 'Cannot deploy integration without workspace handle'

    if (!localHandle && remoteHandle) {
      const confirmAddHandle = await this.prompt.confirm(
        `Your current workspace handle is "${remoteHandle}". Do you want to use the name "${remoteHandle}/${localName}"?`
      )
      if (!confirmAddHandle) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }
      const newName = `${remoteHandle}/${localName}`
      return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
    }

    if (localHandle && !remoteHandle) {
      const { available } = await api.client.checkHandleAvailability({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Could not check handle availability')
      })

      if (!available) {
        throw new errors.BotpressCLIError(`Handle "${localHandle}" is not yours and is not available`)
      }

      const confirmClaimHandle = await this.prompt.confirm(
        `Handle "${localHandle}" is available. Do you want to claim it for your workspace ${workspaceName}?`
      )
      if (!confirmClaimHandle) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      await api.updateWorkspace({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${localHandle}"`)
      })

      this.logger.success(`Handle "${localHandle}" is now yours!`)
      return { integration }
    }

    this.logger.warn("It seems you don't have a workspace handle yet.")
    let claimedHandle: string | undefined = undefined
    do {
      const prompted = await this.prompt.text('Please enter a workspace handle')
      if (!prompted) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      const { available, suggestions } = await api.client.checkHandleAvailability({ handle: prompted })
      if (!available) {
        this.logger.warn(`Handle "${prompted}" is not available. Suggestions: ${suggestions.join(', ')}`)
        continue
      }

      claimedHandle = prompted
      await api.updateWorkspace({ handle: claimedHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${claimedHandle}"`)
      })
    } while (!claimedHandle)

    this.logger.success(`Handle "${claimedHandle}" is yours!`)
    const newName = `${claimedHandle}/${localName}`
    return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
  }

  private _parseIntegrationName = (integrationName: string): { name: string; workspaceHandle?: string } => {
    const parts = integrationName.split('/')
    if (parts.length > 2) {
      throw new errors.BotpressCLIError(
        `Invalid integration name "${integrationName}": a single forward slash is allowed`
      )
    }
    if (parts.length === 2) {
      const [workspaceHandle, name] = parts as [string, string]
      return { name, workspaceHandle }
    }
    const [name] = parts as [string]
    return { name }
  }
}
