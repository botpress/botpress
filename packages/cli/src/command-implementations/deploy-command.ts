import type * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import * as fs from 'fs'
import semver from 'semver'
import * as apiUtils from '../api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { getStrings, interpolate } from '../locales'
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
    const t = getStrings()
    if (this.argv.public && this.argv.visibility === 'private') {
      this.logger.warn(t.messages.publicFlagDeprecated)
      return 'public'
    }

    if (this.argv.public && this.argv.visibility !== 'private') {
      this.logger.warn(t.messages.publicAndVisibilityBoth)
    }

    return this.argv.visibility
  }

  private async _deployIntegration(api: apiUtils.ApiClient, integrationDef: sdk.IntegrationDefinition) {
    const t = getStrings()
    const res = await this._manageWorkspaceHandle(api, integrationDef)
    if (!res) return
    const { integration: updatedIntegrationDef, workspaceId } = res
    integrationDef = updatedIntegrationDef
    if (workspaceId) {
      api = api.switchWorkspace(workspaceId)
    }

    const { name, version } = integrationDef

    if (integrationDef.icon && !integrationDef.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.messages.iconMustBeSvg)
    }

    if (integrationDef.readme && !integrationDef.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.messages.readmeMustBeMd)
    }

    const integration = await api.findPublicOrPrivateIntegration({ type: 'name', name, version })
    if (integration && integration.workspaceId !== api.workspaceId) {
      throw new errors.BotpressCLIError(
        interpolate(t.messages.integrationAlreadyDeployedOther, { name, version })
      )
    }

    if (integration && integration.visibility !== 'private' && !api.isBotpressWorkspace) {
      throw new errors.BotpressCLIError(
        interpolate(t.messages.integrationAlreadyPublic, { name, version })
      )
    }

    let message: string
    if (integration) {
      this.logger.warn(t.messages.integrationExists)
      message = interpolate(t.messages.deployConfirmIntegrationOverride, { name, version })
    } else {
      message = interpolate(t.messages.deployConfirmIntegration, { name, version })
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.messages.aborted)
      return
    }

    this.logger.debug('Preparing integration request body...')

    const createBody = {
      ...(await this.prepareCreateIntegrationBody(integrationDef)),
      ...(await this.prepareIntegrationDependencies(integrationDef, api)),
      visibility: this._visibility,
      sdkVersion: integrationDef.metadata?.sdkVersion,
    }

    const startedMessage = interpolate(t.messages.deployingIntegration, { name: chalk.bold(name), version })
    const successMessage = t.messages.integrationDeployed
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
        this.logger.log(interpolate(t.messages.dryRunActive, { action: 'integration update' }))

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

      createBody.secrets = await this.promptSecrets(integrationDef, this.argv, { knownSecrets })
      this._detectDeprecatedFeatures(integrationDef, {
        allowDeprecated: this._allowDeprecatedFeatures(integrationDef, previousVersion),
      })

      const line = this.logger.line()
      line.started(startedMessage)

      if (this.argv.dryRun) {
        this.logger.log(interpolate(t.messages.dryRunActive, { action: 'integration creation' }))

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
    const t = getStrings()
    if (this._visibility === 'unlisted') {
      throw new errors.BotpressCLIError(t.messages.unlistedNotSupported)
    }

    if (interfaceDeclaration.icon && !interfaceDeclaration.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.messages.iconMustBeSvg)
    }

    if (interfaceDeclaration.readme && !interfaceDeclaration.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.messages.readmeMustBeMd)
    }

    const { name, version } = interfaceDeclaration
    const intrface = await api.findPublicOrPrivateInterface({ type: 'name', name, version })

    let message: string
    if (intrface) {
      this.logger.warn(t.messages.interfaceExists)
      message = interpolate(t.messages.deployConfirmInterfaceOverride, { name, version })
    } else {
      message = interpolate(t.messages.deployConfirmInterface, { name, version })
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.messages.aborted)
      return
    }

    const icon = await this.readProjectFile(interfaceDeclaration.icon, 'base64')
    const readme = await this.readProjectFile(interfaceDeclaration.readme, 'base64')

    if (this._visibility !== 'public') {
      this.logger.warn(t.messages.privateInterfaceWarning)
    }

    const createBody = {
      ...(await apiUtils.prepareCreateInterfaceBody(interfaceDeclaration)),
      public: this._visibility === 'public',
      icon,
      readme,
      sdkVersion: interfaceDeclaration.metadata?.sdkVersion,
    }

    const startedMessage = interpolate(t.messages.deployingInterface, { name: chalk.bold(name), version })
    const successMessage = t.messages.interfaceDeployed
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
        this.logger.warn(interpolate(t.messages.dryRunNotSupported, { action: 'interface updates' }))
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
        this.logger.warn(interpolate(t.messages.dryRunNotSupported, { action: 'interface creation' }))
      } else {
        await api.client.createInterface(createBody).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, `Could not create interface "${name}"`)
        })
      }

      line.success(successMessage)
    }
  }

  private async _deployPlugin(api: apiUtils.ApiClient, pluginDef: sdk.PluginDefinition) {
    const t = getStrings()
    const codeCJS = await fs.promises.readFile(this.projectPaths.abs.outFileCJS, 'utf-8')
    const codeESM = await fs.promises.readFile(this.projectPaths.abs.outFileESM, 'utf-8')

    const { name, version } = pluginDef

    if (pluginDef.icon && !pluginDef.icon.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError(t.messages.iconMustBeSvg)
    }

    if (pluginDef.readme && !pluginDef.readme.toLowerCase().endsWith('.md')) {
      throw new errors.BotpressCLIError(t.messages.readmeMustBeMd)
    }

    const plugin = await api.findPublicOrPrivatePlugin({ type: 'name', name, version })

    let message: string
    if (plugin) {
      this.logger.warn(t.messages.pluginExists)
      message = interpolate(t.messages.deployConfirmPluginOverride, { name, version })
    } else {
      message = interpolate(t.messages.deployConfirmPlugin, { name, version })
    }

    const confirm = await this.prompt.confirm(message)
    if (!confirm) {
      this.logger.log(t.messages.aborted)
      return
    }

    this.logger.debug('Preparing plugin request body...')

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

    const startedMessage = interpolate(t.messages.deployingPlugin, { name: chalk.bold(name), version })
    const successMessage = t.messages.pluginDeployed
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
        this.logger.warn(interpolate(t.messages.dryRunNotSupported, { action: 'plugin updates' }))
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
        this.logger.warn(interpolate(t.messages.dryRunNotSupported, { action: 'plugin creation' }))
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
    const t = getStrings()
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

    const errorMessage = interpolate(t.messages.deprecatedFieldsWarning, { fields: deprecatedFields.join(', ') })

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
    const t = getStrings()
    if (this.argv.dryRun) {
      this.logger.warn(interpolate(t.messages.dryRunNotSupported, { action: 'bot deployments' }))
      return
    }

    const outfile = this.projectPaths.abs.outFileCJS
    const code = await fs.promises.readFile(outfile, 'utf-8')

    let bot: client.Bot
    if (argvBotId && argvCreateNew) {
      throw new errors.BotpressCLIError(t.messages.cannotSpecifyBothBotIdAndCreateNew)
    } else if (argvCreateNew) {
      const confirm = await this.prompt.confirm(t.messages.deployConfirmBotCreate)
      if (!confirm) {
        this.logger.log(t.messages.aborted)
        return
      }

      bot = await this._createNewBot(api)
    } else {
      bot = await this._getExistingBot(api, argvBotId)

      const confirm = await this.prompt.confirm(interpolate(t.messages.deployConfirmBot, { name: bot.name }))
      if (!confirm) {
        this.logger.log(t.messages.aborted)
        return
      }
    }

    const line = this.logger.line()
    line.started(interpolate(t.messages.deployingBot, { name: chalk.bold(bot.name) }))

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
      throw errors.BotpressCLIError.wrap(thrown, interpolate(t.messages.couldNotUpdateBot, { name: bot.name }))
    })

    this.validateIntegrationRegistration(updatedBot, (failedIntegrations) =>
      this.logger.warn(
        `${t.messages.integrationsFailedToRegister}\n${Object.entries(failedIntegrations)
          .map(([key, int]) => `• ${key}: ${int.statusReason}`)
          .join('\n')}`
      )
    )

    const tablesPublisher = new tables.TablesPublisher({ api, logger: this.logger, prompt: this.prompt })
    await tablesPublisher.deployTables({ botId: updatedBot.id, botDefinition })

    line.success(t.messages.botDeployed)
    await this.displayIntegrationUrls({ api, bot: updatedBot })
  }

  private async _createNewBot(api: apiUtils.ApiClient): Promise<client.Bot> {
    const t = getStrings()
    const line = this.logger.line()
    const { bot: createdBot } = await api.client.createBot({}).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotCreateBot)
    })
    line.success(interpolate(t.messages.botCreatedWithId, { id: createdBot.id, name: createdBot.name }))
    await this.projectCache.set('botId', createdBot.id)
    return createdBot
  }

  private async _getExistingBot(api: apiUtils.ApiClient, botId: string | undefined): Promise<client.Bot> {
    const t = getStrings()
    const promptedBotId = await this.projectCache.sync('botId', botId, async (defaultId) => {
      const userBots = await api
        .listAllPages(api.client.listBots, (r) => r.bots)
        .catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotListBots)
        })

      if (!userBots.length) {
        throw new errors.NoBotsFoundError()
      }

      const initial = userBots.find((bot) => bot.id === defaultId)

      const prompted = await this.prompt.select(t.messages.selectBotDeploy, {
        initial: initial && { title: initial.name, value: initial.id },
        choices: userBots.map((bot) => ({ title: bot.name, value: bot.id })),
      })

      if (!prompted) {
        throw new errors.ParamRequiredError('Bot Id')
      }

      return prompted
    })

    const { bot: fetchedBot } = await api.client.getBot({ id: promptedBotId }).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotGetBot)
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
    const t = getStrings()
    const { name: localName, workspaceHandle: localHandle } = this._parseIntegrationName(integration.name)
    if (!localHandle && api.isBotpressWorkspace) {
      this.logger.debug('Botpress workspace detected; workspace handle omitted')
      return { integration } // botpress has the right to omit workspace handle
    }

    const { handle: remoteHandle, name: workspaceName } = await api.getWorkspace().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotFetchWorkspace)
    })

    if (localHandle && remoteHandle) {
      let workspaceId: string | undefined = undefined
      if (localHandle !== remoteHandle) {
        const remoteWorkspace = await api.findWorkspaceByHandle(localHandle).catch((thrown) => {
          throw errors.BotpressCLIError.wrap(thrown, t.messages.couldNotListWorkspaces)
        })
        if (!remoteWorkspace) {
          throw new errors.BotpressCLIError(
            `The integration handle "${localHandle}" is not associated with any of your workspaces.`
          )
        }
        this.logger.warn(
          `Your are logged in to workspace "${workspaceName}" but integration handle "${localHandle}" belongs to "${remoteWorkspace.name}".`
        )
        const confirmUseAlternateWorkspace = await this.prompt.confirm(t.messages.deployOnAnotherWorkspace)
        if (!confirmUseAlternateWorkspace) {
          throw new errors.BotpressCLIError(
            interpolate(t.messages.cannotDeployWithHandle, { handle: localHandle, workspace: workspaceName })
          )
        }

        workspaceId = remoteWorkspace.id
      }
      return { integration, workspaceId }
    }

    const workspaceHandleIsMandatoryMsg = t.messages.workspaceHandleRequired

    if (!localHandle && remoteHandle) {
      const confirmAddHandle = await this.prompt.confirm(
        interpolate(t.messages.workspaceHandleConfirm, { handle: remoteHandle, name: localName })
      )
      if (!confirmAddHandle) {
        this.logger.log(t.messages.aborted)
        return
      }
      const newName = `${remoteHandle}/${localName}`
      return { integration: new sdk.IntegrationDefinition({ ...integration, name: newName }) }
    }

    if (localHandle && !remoteHandle) {
      const { available } = await api.client.checkHandleAvailability({ handle: localHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Could not check handle availability')
      })

      if (!available) {
        throw new errors.BotpressCLIError(interpolate(t.messages.workspaceHandleNotYours, { handle: localHandle }))
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

      this.logger.success(interpolate(t.messages.workspaceHandleClaimed, { handle: localHandle }))
      return { integration }
    }

    this.logger.warn(t.messages.noWorkspaceHandle)
    let claimedHandle: string | undefined = undefined
    do {
      const prompted = await this.prompt.text(t.messages.workspaceHandleEnter)
      if (!prompted) {
        throw new errors.BotpressCLIError(workspaceHandleIsMandatoryMsg)
      }

      const { available, suggestions } = await api.client.checkHandleAvailability({ handle: prompted })
      if (!available) {
        this.logger.warn(interpolate(t.messages.workspaceHandleNotAvailable, { handle: prompted, suggestions: suggestions.join(', ') }))
        continue
      }

      claimedHandle = prompted
      await api.updateWorkspace({ handle: claimedHandle }).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${claimedHandle}"`)
      })
    } while (!claimedHandle)

    this.logger.success(interpolate(t.messages.workspaceHandleClaimed, { handle: claimedHandle }))
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
