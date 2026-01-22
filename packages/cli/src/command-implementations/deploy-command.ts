import type * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import * as fs from 'fs'
import semver from 'semver'
import * as apiUtils from '../api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { t } from '../locales'
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

    const { projectType, resolveProjectDefinition } = this.readProjectDefinitionFromFS()

    if (projectType === 'integration') {
      const projectDef = await resolveProjectDefinition()
      return this._deployIntegration(api, projectDef.definition)
    }
    if (projectType === 'interface') {
      const projectDef = await resolveProjectDefinition()
      return this._deployInterface(api, projectDef.definition)
    }
    if (projectType === 'plugin') {
      const projectDef = await resolveProjectDefinition()
      return this._deployPlugin(api, projectDef.definition)
    }
    if (projectType === 'bot') {
      const projectDef = await resolveProjectDefinition()
      return this._deployBot(api, projectDef.definition, this.argv.botId, this.argv.createNewBot)
    }
    throw new errors.UnsupportedProjectType()
  }

  private async _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).setProjectContext(this.projectContext).run()
  }

  private get _visibility(): 'public' | 'private' | 'unlisted' {
    if (this.argv.public && this.argv.visibility === 'private') {
      this.logger.warn(t.deploy.publicFlagDeprecated)
      return 'public'
    }

    if (this.argv.public && this.argv.visibility !== 'private') {
      this.logger.warn(t.deploy.publicAndVisibilityBothPresent)
    }

    return this.argv.visibility
  }

  private async _deployIntegration(api: apiUtils.ApiClient, integrationDef: sdk.IntegrationDefinition) {
    const res = await this._manageWorkspaceHandle(api, integrationDef)
    if (!res) return
    const { integration: updatedIntegrationDef, workspaceId } = res
    integrationDef = updatedIntegrationDef
    if (workspaceId) {
      api = api.switchWorkspace(workspaceId)
    }

    const { name, version } = integrationDef

    if (integrationDef.icon && !integrationDef.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.deploy.iconMustBeSvg)
    }

    if (integrationDef.readme && !integrationDef.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.deploy.readmeMustBeMd)
    }

    const integration = await api.findPublicOrPrivateIntegration({ type: 'name', name, version })
    if (integration && integration.workspaceId !== api.workspaceId) {
      throw new errors.BotpressCLIError(t.deploy.integrationInAnotherWorkspace(name, version))
    }

    if (integration && integration.visibility !== 'private' && !api.isBotpressWorkspace) {
      throw new errors.BotpressCLIError(t.deploy.integrationAlreadyPublic(name, version))
    }

    let message: string
    if (integration) {
      this.logger.warn(t.deploy.integrationExists)
      message = t.deploy.confirmOverrideIntegration(name, version)
    } else {
      message = t.deploy.confirmDeployIntegration(name, version)
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.common.aborted)
      return
    }

    this.logger.debug(t.deploy.preparingIntegration)

    const createBody = {
      ...(await this.prepareCreateIntegrationBody(integrationDef)),
      ...(await this.prepareIntegrationDependencies(integrationDef, api)),
      visibility: this._visibility,
      sdkVersion: integrationDef.metadata?.sdkVersion,
    }

    const startedMessage = t.deploy.deployingIntegration(chalk.bold(name), version)
    const successMessage = t.deploy.integrationDeployed
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
        this.logger.log(t.deploy.dryRunSimulating)

        await api.client.validateIntegrationUpdate(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotUpdateIntegration(name))
        })
      } else {
        await api.client.updateIntegration(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotUpdateIntegration(name))
        })
      }

      line.success(successMessage)
    } else {
      this.logger.debug(t.deploy.lookingForPreviousVersion(name))
      const previousVersion = await api.findPreviousIntegrationVersion({ type: 'name', name, version })

      if (previousVersion) {
        this.logger.debug(t.deploy.previousVersionFound(previousVersion.version))
      } else {
        this.logger.debug(t.deploy.noPreviousVersionFound)
      }

      const knownSecrets = previousVersion?.secrets

      createBody.secrets = await this.promptSecrets(integrationDef, this.argv, { knownSecrets })
      this._detectDeprecatedFeatures(integrationDef, {
        allowDeprecated: this._allowDeprecatedFeatures(integrationDef, previousVersion),
      })

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.log(t.deploy.dryRunSimulating)

        await api.client.validateIntegrationCreation(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCreateIntegration(name))
        })
      } else {
        await api.client.createIntegration(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCreateIntegration(name))
        })
      }

      line.success(successMessage)
    }
  }

  private async _deployInterface(api: apiUtils.ApiClient, interfaceDeclaration: sdk.InterfaceDefinition) {
    if (this._visibility === 'unlisted') {
      throw new errors.BotpressCLIError(t.deploy.unlistedNotSupported)
    }

    if (interfaceDeclaration.icon && !interfaceDeclaration.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.deploy.iconMustBeSvg)
    }

    if (interfaceDeclaration.readme && !interfaceDeclaration.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.deploy.readmeMustBeMd)
    }

    const { name, version } = interfaceDeclaration
    const intrface = await api.findPublicOrPrivateInterface({ type: 'name', name, version })

    let message: string
    if (intrface) {
      this.logger.warn(t.deploy.interfaceExists)
      message = t.deploy.confirmOverrideInterface(name, version)
    } else {
      message = t.deploy.confirmDeployInterface(name, version)
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.common.aborted)
      return
    }

    const icon = await this.readProjectFile(interfaceDeclaration.icon, 'base64')
    const readme = await this.readProjectFile(interfaceDeclaration.readme, 'base64')

    if (this._visibility !== 'public') {
      this.logger.warn(t.deploy.privateInterfaceWarning)
    }

    const createBody = {
      ...(await apiUtils.prepareCreateInterfaceBody(interfaceDeclaration)),
      public: this._visibility === 'public',
      icon,
      readme,
      sdkVersion: interfaceDeclaration.metadata?.sdkVersion,
    }

    const startedMessage = t.deploy.deployingInterface(chalk.bold(name), version)
    const successMessage = t.deploy.interfaceDeployed
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
        this.logger.warn(t.deploy.dryRunNotSupportedInterfaceUpdate)
      } else {
        await api.client.updateInterface(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotUpdateInterface(name))
        })
      }

      line.success(successMessage)
    } else {
      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn(t.deploy.dryRunNotSupportedInterfaceCreate)
      } else {
        await api.client.createInterface(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCreateInterface(name))
        })
      }

      line.success(successMessage)
    }
  }

  private async _deployPlugin(api: apiUtils.ApiClient, pluginDef: sdk.PluginDefinition) {
    const codeCJS = await fs.promises.readFile(this.projectPaths.abs.outFileCJS, 'utf-8')
    const codeESM = await fs.promises.readFile(this.projectPaths.abs.outFileESM, 'utf-8')

    const { name, version } = pluginDef

    if (pluginDef.icon && !pluginDef.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.deploy.iconMustBeSvg)
    }

    if (pluginDef.readme && !pluginDef.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.deploy.readmeMustBeMd)
    }

    const plugin = await api.findPublicOrPrivatePlugin({ type: 'name', name, version })

    let message: string
    if (plugin) {
      this.logger.warn(t.deploy.pluginExists)
      message = t.deploy.confirmOverridePlugin(name, version)
    } else {
      message = t.deploy.confirmDeployPlugin(name, version)
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.common.aborted)
      return
    }

    this.logger.debug(t.deploy.preparingPlugin)

    const icon = await this.readProjectFile(pluginDef.icon, 'base64')
    const readme = await this.readProjectFile(pluginDef.readme, 'base64')

    const createBody = {
      ...(await apiUtils.prepareCreatePluginBody(pluginDef)),
      ...(await this.preparePluginDependencies(pluginDef, api)),
      visibility: this._visibility,
      icon,
      readme,
      code: {
        node: codeCJS,
        browser: codeESM,
      },
      sdkVersion: pluginDef.metadata?.sdkVersion,
    }

    const startedMessage = t.deploy.deployingPlugin(chalk.bold(name), version)
    const successMessage = t.deploy.pluginDeployed
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
        this.logger.warn(t.deploy.dryRunNotSupportedPluginUpdate)
      } else {
        await api.client.updatePlugin(updateBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotUpdatePlugin(name))
        })
      }

      line.success(successMessage)
    } else {
      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.warn(t.deploy.dryRunNotSupportedPluginCreate)
      } else {
        await api.client.createPlugin(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCreatePlugin(name))
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

    const errorMessage = t.deploy.deprecatedFieldsWarning(deprecatedFields.join(', '))

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
      this.logger.warn(t.deploy.dryRunNotSupportedBot)
      return
    }

    const outfile = this.projectPaths.abs.outFileCJS
    const code = await fs.promises.readFile(outfile, 'utf-8')

    let bot: client.Bot
    if (argvBotId && argvCreateNew) {
      throw new errors.BotpressCLIError(t.deploy.cannotSpecifyBothBotIdAndCreateNew)
    } else if (argvCreateNew) {
      const confirm = await this.prompt.confirm(t.deploy.confirmCreateNewBot)
      if (!confirm) {
        this.logger.log(t.common.aborted)
        return
      }

      bot = await this._createNewBot(api)
    } else {
      bot = await this._getExistingBot(api, argvBotId)

      const confirm = await this.prompt.confirm(t.deploy.confirmDeployBot(bot.name))
      if (!confirm) {
        this.logger.log(t.common.aborted)
        return
      }
    }

    const line = this.logger.line()
    line.started(t.deploy.deployingBot(chalk.bold(bot.name)))

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
      throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotUpdateBot(bot.name))
    })

    this.validateIntegrationRegistration(updatedBot, (failedIntegrations) =>
      this.logger.warn(
        `${t.deploy.someIntegrationsFailed}\n${Object.entries(failedIntegrations)
          .map(([key, int]) => `• ${key}: ${int.statusReason}`)
          .join('\n')}`
      )
    )

    const tablesPublisher = new tables.TablesPublisher({ api, logger: this.logger, prompt: this.prompt })
    await tablesPublisher.deployTables({ botId: updatedBot.id, botDefinition })

    line.success(t.deploy.botDeployed)
    await this.displayIntegrationUrls({ api, bot: updatedBot })
  }

  private async _createNewBot(api: apiUtils.ApiClient): Promise<client.Bot> {
    const line = this.logger.line()
    const { bot: createdBot } = await api.client.createBot({}).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCreateBot)
    })
    line.success(t.deploy.botCreatedWithId(createdBot.id, createdBot.name))
    await this.projectCache.set('botId', createdBot.id)
    return createdBot
  }

  private async _getExistingBot(api: apiUtils.ApiClient, botId: string | undefined): Promise<client.Bot> {
    const promptedBotId = await this.projectCache.sync('botId', botId, async (defaultId) => {
      const userBots = await api
        .listAllPages(api.client.listBots, (r) => r.bots)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotFetchBots)
        })

      if (!userBots.length) {
        throw new errors.NoBotsFoundError()
      }

      const initial = userBots.find((bot) => bot.id === defaultId)

      const prompted = await this.prompt.select(t.deploy.whichBotToDeploy, {
        initial: initial && { title: initial.name, value: initial.id },
        choices: userBots.map((bot) => ({ title: bot.name, value: bot.id })),
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Bot Id')
      }

      return prompted
    })

    const { bot: fetchedBot } = await api.client.getBot({ id: promptedBotId }).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotGetBotInfo)
    })

    return fetchedBot
  }

  private async _manageWorkspaceHandle(
    api: apiUtils.ApiClient,
    integration: sdk.IntegrationDefinition
  ): Promise<
    | {
        integration: sdk.IntegrationDefinition
        workspaceId?: string // Set if user opted to deploy on another available workspace
      }
    | undefined
  > {
    const { name: localName, workspaceHandle: localHandle } = this._parseIntegrationName(integration.name)
    if (!localHandle && api.isBotpressWorkspace) {
      this.logger.debug('Botpress workspace detected; workspace handle omitted')
      return { integration } // botpress has the right to omit workspace handle
    }

    const { handle: remoteHandle, name: workspaceName } = await api.getWorkspace().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotFetchWorkspace)
    })

    if (localHandle && remoteHandle) {
      let workspaceId: string | undefined = undefined
      if (localHandle !== remoteHandle) {
        const remoteWorkspace = await api.findWorkspaceByHandle(localHandle).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotListWorkspaces)
        })
        if (!remoteWorkspace) {
          throw new errors.BotpressCLIError(t.deploy.handleNotAssociated(localHandle))
        }
        this.logger.warn(t.deploy.loggedInToDifferentWorkspace(workspaceName, localHandle, remoteWorkspace.name))
        const confirmUseAlternateWorkspace = await this.prompt.confirm(t.deploy.confirmUseAlternateWorkspace)
        if (!confirmUseAlternateWorkspace) {
          throw new errors.BotpressCLIError(t.deploy.cannotDeployWithHandle(localHandle, workspaceName))
        }

        workspaceId = remoteWorkspace.id
      }
      return { integration, workspaceId }
    }

    const workspaceHandleIsMandatoryMsg = t.deploy.cannotDeployWithoutHandle

    if (!localHandle && remoteHandle) {
      const confirmAddHandle = await this.prompt.confirm(
        t.deploy.confirmUseHandleName(remoteHandle, localName)
      )
      if (!confirmAddHandle) {
        this.logger.log(t.common.aborted)
        return
      }
      const newName = `${remoteHandle}/${localName}`
      return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
    }

    if (localHandle && !remoteHandle) {
      const { available } = await api.client.checkHandleAvailability({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotCheckHandle)
      })

      if (!available) {
        throw new errors.BotpressCLIError(t.deploy.handleNotAvailable(localHandle))
      }

      const confirmClaimHandle = await this.prompt.confirm(
        t.deploy.confirmClaimHandle(localHandle, workspaceName)
      )
      if (!confirmClaimHandle) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      await api.updateWorkspace({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotClaimHandle(localHandle))
      })

      this.logger.success(t.deploy.handleIsYours(localHandle))
      return { integration }
    }

    this.logger.warn(t.deploy.noWorkspaceHandle)
    let claimedHandle: string | undefined = undefined
    do {
      const prompted = await this.prompt.text(t.deploy.enterWorkspaceHandle)
      if (!prompted) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      const { available, suggestions } = await api.client.checkHandleAvailability({ handle: prompted })
      if (!available) {
        this.logger.warn(t.deploy.handleNotAvailableSuggestions(prompted, suggestions.join(', ')))
        continue
      }

      claimedHandle = prompted
      await api.updateWorkspace({ handle: claimedHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, t.deploy.couldNotClaimHandle(claimedHandle!))
      })
    } while (!claimedHandle)

    this.logger.success(t.deploy.handleIsYours(claimedHandle))
    const newName = `${claimedHandle}/${localName}`
    return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
  }

  private _parseIntegrationName = (integrationName: string): { name: string; workspaceHandle?: string } => {
    const parts = integrationName.split('/')
    if (parts.length > 2) {
      throw new errors.BotpressCLIError(t.deploy.invalidIntegrationName(integrationName))
    }
    if (parts.length === 2) {
      const [workspaceHandle, name] = parts as [string, string]
      return { name, workspaceHandle }
    }
    const [name] = parts as [string]
    return { name }
  }
}
