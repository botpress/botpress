import type * as client from '@botpress/client'
import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import { ApiClient } from 'src/api'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import { Logger } from '../logger'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

const projectTypes = ['bot', 'integration', 'plugin'] as const
type ProjectType = (typeof projectTypes)[number]

type CopyProps = { srcDir: string; destDir: string; name: string; pkgJson: Record<string, unknown> }

export type InitCommandDefinition = typeof commandDefinitions.init
export class InitCommand extends GlobalCommand<InitCommandDefinition> {
  public async run(): Promise<void> {
    const projectType = await this._promptProjectType()
    const workDir = utils.path.absoluteFrom(utils.path.cwd(), this.argv.workDir)

    if (projectType === 'bot') {
      await this._initBot({ workDir })
      return
    }

    if (projectType === 'integration') {
      const workspaceHandle = await this._promptWorkspaceHandle()
      await this._initIntegration({ workDir, workspaceHandle })
      return
    }

    if (projectType === 'plugin') {
      const workspaceHandle = await this._promptWorkspaceHandle()
      await this._initPlugin({ workDir, workspaceHandle })
      return
    }

    type _assertion = utils.types.AssertNever<typeof projectType>
    throw new errors.BotpressCLIError(`Unknown project type: ${projectType}`)
  }

  private async _promptWorkspaceHandle() {
    const client = (await this.getAuthenticatedClient({})) ?? undefined

    const nameParts = this.argv.name?.split('/', 2) ?? []
    const workspaceHandle = nameParts.length > 1 ? nameParts[0] : undefined

    const resolver = await WorkspaceResolver.from({
      client,
      workspaceHandle,
      prompt: this.prompt,
      logger: this.logger,
    })

    return await resolver.getWorkspaceHandle()
  }

  private async _promptProjectType() {
    if (this.argv.type) {
      return this.argv.type
    }

    const promptedType = await this.prompt.select('What type of project do you wish to initialize?', {
      choices: projectTypes.map((t) => ({ title: t, value: t })),
    })

    if (!promptedType) {
      throw new errors.ParamRequiredError('Project Type')
    }

    return promptedType
  }

  private _initPlugin = async (args: { workDir: string; workspaceHandle: string }) => {
    const { workDir, workspaceHandle } = args
    const name = await this._getName('plugin', consts.emptyPluginDirName)
    const { fullName, shortName } = this._getFullNameAndShortName({ workspaceHandle, name })

    await this._copy({
      srcDir: this.globalPaths.abs.emptyPluginTemplate,
      destDir: workDir,
      name: shortName,
      pkgJson: {
        pluginName: fullName,
      },
    })
    this.logger.success(`Plugin project initialized in ${chalk.bold(pathlib.join(workDir, shortName))}`)
  }

  private _getFullNameAndShortName(args: { workspaceHandle: string; name: string }) {
    const [workspaceOrName, projectName] = args.name.split('/', 2)
    const shortName = projectName ?? workspaceOrName!
    const fullName = `${args.workspaceHandle}/${shortName}`

    return { shortName, fullName }
  }

  private _initBot = async (args: { workDir: string }) => {
    const { workDir } = args
    const name = await this._getName('bot', consts.emptyBotDirName)

    await this._copy({ srcDir: this.globalPaths.abs.emptyBotTemplate, destDir: workDir, name, pkgJson: {} })
    this.logger.success(`Bot project initialized in ${chalk.bold(pathlib.join(workDir, name))}`)
  }

  private _initIntegration = async (args: { workDir: string; workspaceHandle: string }) => {
    const { workDir, workspaceHandle } = args

    const template = await this.prompt.select('Which template do you want to use?', {
      choices: [
        { title: 'Empty Integration', value: consts.emptyIntegrationDirName },
        { title: 'Hello World', value: consts.helloWorldIntegrationDirName },
        { title: 'Webhook Message', value: consts.webhookMessageIntegrationDirName },
      ],
      default: consts.emptyIntegrationDirName,
    })

    let srcDirPath: string
    if (template === consts.helloWorldIntegrationDirName) {
      srcDirPath = this.globalPaths.abs.helloWorldIntegrationTemplate
    } else if (template === consts.webhookMessageIntegrationDirName) {
      srcDirPath = this.globalPaths.abs.webhookMessageIntegrationTemplate
    } else {
      srcDirPath = this.globalPaths.abs.emptyIntegrationTemplate
    }

    const name = await this._getName('integration', template ?? consts.emptyIntegrationDirName)
    const { fullName, shortName } = this._getFullNameAndShortName({ workspaceHandle, name })

    await this._copy({
      srcDir: srcDirPath,
      destDir: workDir,
      name: shortName,
      pkgJson: {
        integrationName: fullName,
      },
    })
    this.logger.success(`Integration project initialized in ${chalk.bold(pathlib.join(workDir, shortName))}`)
    return
  }

  private _getName = async (projectType: ProjectType, defaultName: string): Promise<string> => {
    if (this.argv.name) {
      return this.argv.name
    }
    const promptMessage = `What is the name of your ${projectType}?`
    const promptedName = await this.prompt.text(promptMessage, { initial: defaultName })
    if (!promptedName) {
      throw new errors.ParamRequiredError('Project Name')
    }
    return promptedName
  }

  private _copy = async (props: CopyProps) => {
    const { srcDir, destDir, name, pkgJson } = props

    const dirName = utils.casing.to.kebabCase(name)
    const destination = pathlib.join(destDir, dirName)

    const exist = await this._checkIfDestinationExists(destination)
    if (exist) {
      return
    }

    await fs.promises.cp(srcDir, destination, { recursive: true })

    const pkgJsonPath = pathlib.join(destination, 'package.json')
    const strContent = await fs.promises.readFile(pkgJsonPath, 'utf-8')
    const json = JSON.parse(strContent)

    const pkgJsonName = utils.casing.to.snakeCase(name)
    const updatedJson = { name: pkgJsonName, ...json, ...pkgJson }
    await fs.promises.writeFile(pkgJsonPath, JSON.stringify(updatedJson, null, 2))
  }

  private _checkIfDestinationExists = async (destination: string) => {
    if (fs.existsSync(destination)) {
      const override = await this.prompt.confirm(
        `Directory ${chalk.bold(destination)} already exists. Do you want to overwrite it?`
      )
      if (!override) {
        this.logger.log('Aborting')
        return true
      }
    }
    return false
  }
}

class WorkspaceResolver {
  private _workspaces: client.Workspace[] = []
  private _currentWorkspace?: client.Workspace

  private constructor(
    private readonly _client: ApiClient | undefined,
    private readonly _workspaceHandle: string | undefined,
    private readonly _prompt: utils.prompt.CLIPrompt,
    private readonly _logger: Logger
  ) {}

  public static async from({
    client,
    workspaceHandle,
    prompt,
    logger,
  }: {
    client?: ApiClient
    workspaceHandle?: string
    prompt: utils.prompt.CLIPrompt
    logger: Logger
  }): Promise<WorkspaceResolver> {
    const resolver = new WorkspaceResolver(client, workspaceHandle, prompt, logger)
    await resolver._fetchWorkspaces()
    return resolver
  }

  public async getWorkspaceHandle(): Promise<string> {
    if (this._hasNoWorkspaces()) {
      return this._promptForArbitraryWorkspaceHandle()
    }

    return await this._promptUserToSelectWorkspace()
  }

  private async _fetchWorkspaces(): Promise<void> {
    if (!this._isAuthenticated()) {
      return
    }

    const workspaces = (await this._getClient().listWorkspaces()).workspaces
    const currentWorkspace = workspaces.find((ws) => ws.id === this._getClient().workspaceId)

    this._workspaces = workspaces
    this._currentWorkspace = currentWorkspace
  }

  private _isAuthenticated(): boolean {
    return !!this._client
  }

  private _hasNoWorkspaces(): boolean {
    return !this._isAuthenticated() || this._workspaces.length === 0 || !this._currentWorkspace
  }

  private async _promptForArbitraryWorkspaceHandle(): Promise<string> {
    if (this._workspaceHandle) {
      return this._workspaceHandle
    }

    const handle = await this._prompt.text('Enter your workspace handle')

    if (!handle) {
      throw new errors.ParamRequiredError('Workspace handle')
    }

    return handle
  }

  private async _promptUserToSelectWorkspace(): Promise<string> {
    const workspaceChoices = this._workspaces.map((ws) => ({
      title: ws.name,
      value: ws.id,
    }))

    const initialChoice = {
      title: this._currentWorkspace!.name,
      value: this._currentWorkspace!.id,
    }

    const workspaceId = await this._prompt.select('Which workspace do you want to use?', {
      initial: initialChoice,
      choices: workspaceChoices,
    })

    const handle = this._workspaces.find((ws) => ws.id === workspaceId)?.handle

    if (!handle) {
      this._logger.warn("This workspace has no handle. You'll have to enter it manually.")
      return this._promptForArbitraryWorkspaceHandle()
    }

    return handle
  }

  private _getClient(): ApiClient {
    if (!this._client) {
      throw new errors.BotpressCLIError('Could not authenticate')
    }
    return this._client
  }
}
