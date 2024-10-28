import type * as client from '@botpress/client'
import * as sdk from '@botpress/sdk'
import chalk from 'chalk'
import * as fs from 'fs'
import semver from 'semver'
import { prepareCreateBotBody, prepareUpdateBotBody } from '../api/bot-body'
import type { ApiClient } from '../api/client'
import {
  CreateIntegrationBody,
  prepareUpdateIntegrationBody,
  prepareCreateIntegrationBody,
} from '../api/integration-body'
import { CreateInterfaceBody, prepareCreateInterfaceBody, prepareUpdateInterfaceBody } from '../api/interface-body'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { getImplementationStatements } from '../sdk'
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
    if (projectDef.type === 'bot') {
      return this._deployBot(api, projectDef.definition, this.argv.botId, this.argv.createNewBot)
    }
    throw new errors.UnsupportedProjectType()
  }

  private async _runBuild() {
    return new BuildCommand(this.api, this.prompt, this.logger, this.argv).run()
  }

  private async _deployIntegration(api: ApiClient, integrationDef: sdk.IntegrationDefinition) {
    const outfile = this.projectPaths.abs.outFile
    const code = await fs.promises.readFile(outfile, 'utf-8')

    integrationDef = await this._manageWorkspaceHandle(api, integrationDef)

    const { name, version, icon: iconRelativeFilePath, readme: readmeRelativeFilePath, identifier } = integrationDef

    if (iconRelativeFilePath && !iconRelativeFilePath.toLowerCase().endsWith('.svg')) {
      throw new errors.BotpressCLIError('Icon must be an SVG file')
    }

    const iconFileContent = await this._readMediaFile('icon', iconRelativeFilePath)
    const readmeFileContent = await this._readMediaFile('readme', readmeRelativeFilePath)
    const identifierExtractScriptFileContent = await this.readProjectFile(identifier?.extractScript)
    const fallbackHandlerScriptFileContent = await this.readProjectFile(identifier?.fallbackHandlerScript)

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

    let createBody: CreateIntegrationBody = await prepareCreateIntegrationBody(integrationDef)
    createBody = {
      ...createBody,
      interfaces: await this._formatInterfacesImplStatements(api, integrationDef),
      code,
      icon: iconFileContent,
      readme: readmeFileContent,
      configuration: await this.readIntegrationConfigDefinition(createBody.configuration),
      configurations: await utils.promises.awaitRecord(
        utils.records.mapValues(createBody.configurations ?? {}, this.readIntegrationConfigDefinition.bind(this))
      ),
      identifier: {
        extractScript: identifierExtractScriptFileContent,
        fallbackHandlerScript: fallbackHandlerScriptFileContent,
      },
      public: this.argv.public,
    }

    const startedMessage = `Deploying integration ${chalk.bold(name)} v${version}...`
    const successMessage = 'Integration deployed'
    if (integration) {
      const updateBody = prepareUpdateIntegrationBody(
        {
          id: integration.id,
          ...createBody,
          public: this.argv.public,
        },
        integration
      )

      const { secrets: knownSecrets } = integration
      updateBody.secrets = await this.promptSecrets(integrationDef, this.argv, { knownSecrets })
      this._detectDeprecatedFeatures(integrationDef, { allowDeprecated: true })

      const line = this.logger.line()
      line.started(startedMessage)
      await api.client.updateIntegration(updateBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not update integration "${name}"`)
      })
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
      await api.client.createIntegration(createBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not create integration "${name}"`)
      })
      line.success(successMessage)
    }
  }

  private async _deployInterface(api: ApiClient, interfaceDeclaration: sdk.InterfaceDeclaration) {
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

    const createBody: CreateInterfaceBody = await prepareCreateInterfaceBody(interfaceDeclaration)

    const startedMessage = `Deploying interface ${chalk.bold(name)} v${version}...`
    const successMessage = 'Interface deployed'
    if (intrface) {
      const updateBody = prepareUpdateInterfaceBody(
        {
          id: intrface.id,
          ...createBody,
        },
        intrface
      )

      const line = this.logger.line()
      line.started(startedMessage)
      await api.client.updateInterface(updateBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not update interface "${name}"`)
      })
      line.success(successMessage)
    } else {
      const line = this.logger.line()
      line.started(startedMessage)
      await api.client.createInterface(createBody).catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, `Could not create interface "${name}"`)
      })
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

  private async _deployBot(
    api: ApiClient,
    botDefinition: sdk.BotDefinition,
    argvBotId: string | undefined,
    argvCreateNew: boolean | undefined
  ) {
    const outfile = this.projectPaths.abs.outFile
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

    const integrationInstances = await this.fetchBotIntegrationInstances(botDefinition, api)
    const createBotBody = await prepareCreateBotBody(botDefinition)
    const updateBotBody = prepareUpdateBotBody(
      {
        ...createBotBody,
        id: bot.id,
        code,
        integrations: integrationInstances,
      },
      bot
    )

    const { bot: updatedBot } = await api.client.updateBot(updateBotBody).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, `Could not update bot "${bot.name}"`)
    })
    line.success('Bot deployed')
    this.displayWebhookUrls(updatedBot)
  }

  private async _createNewBot(api: ApiClient): Promise<client.Bot> {
    const line = this.logger.line()
    const { bot: createdBot } = await api.client.createBot({}).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not create bot')
    })
    line.success(`Bot created with ID "${createdBot.id}" and name "${createdBot.name}"`)
    await this.projectCache.set('botId', createdBot.id)
    return createdBot
  }

  private async _getExistingBot(api: ApiClient, botId: string | undefined): Promise<client.Bot> {
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
    api: ApiClient,
    integration: sdk.IntegrationDefinition
  ): Promise<sdk.IntegrationDefinition> {
    const { name: localName, workspaceHandle: localHandle } = this._parseIntegrationName(integration.name)
    if (!localHandle && api.isBotpressWorkspace) {
      this.logger.debug('Botpress workspace detected; workspace handle omitted')
      return integration // botpress has the right to omit workspace handle
    }

    const { handle: remoteHandle, name: workspaceName } = await api.getWorkspace().catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not fetch workspace')
    })

    if (localHandle && remoteHandle) {
      if (localHandle !== remoteHandle) {
        throw new errors.BotpressCLIError(
          `Your current workspace handle is "${remoteHandle}" but the integration handle is "${localHandle}".`
        )
      }
      return integration
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
      return new sdk.IntegrationDefinition({ ...integration, name: newName })
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
      return integration
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
    return new sdk.IntegrationDefinition({ ...integration, name: newName })
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

  private _formatInterfacesImplStatements = async (
    api: ApiClient,
    integration: sdk.IntegrationDefinition
  ): Promise<CreateIntegrationBody['interfaces']> => {
    const interfacesStatements = getImplementationStatements(integration)
    const interfaces: NonNullable<CreateIntegrationBody['interfaces']> = {}
    for (const [key, i] of Object.entries(interfacesStatements)) {
      const { name, version, entities, actions, events, channels } = i
      const id = await this._getInterfaceId(api, { id: i.id, name, version })
      interfaces[key] = { id, entities, actions, events, channels }
    }

    return interfaces
  }

  private _getInterfaceId = async (
    api: ApiClient,
    ref: { id?: string; name: string; version: string }
  ): Promise<string> => {
    if (ref.id) {
      return ref.id
    }
    const intrface = await api.findPublicInterface({ type: 'name', name: ref.name, version: ref.version })
    if (!intrface) {
      throw new errors.BotpressCLIError(`Could not find interface "${ref.name}@${ref.version}"`)
    }
    return intrface.id
  }
}
