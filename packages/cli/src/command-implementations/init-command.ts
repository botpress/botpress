import type * as client from '@botpress/client'
import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import { ApiClient } from 'src/api'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { Logger } from '../logger'
import { ProjectTemplates } from '../project-templates'
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
    const template = await this._getOrPromptForTemplate('plugin')
    const name = await this._getName('plugin', template.defaultProjectName)
    const { fullName, shortName } = this._getFullNameAndShortName({ workspaceHandle, name })

    await this._copy({
      srcDir: template.absolutePath,
      destDir: workDir,
      name: shortName,
      pkgJson: {
        pluginName: fullName,
      },
    })
    this.logger.success(`Plugin project initialized in ${chalk.bold(pathlib.join(workDir, shortName))}`)
  }

  private async _getOrPromptForTemplate(type: ProjectType): Promise<ProjectTemplates.Template> {
    const availableTemplates = ProjectTemplates.templates[type]

    if (this.argv.template) {
      const template = availableTemplates.find((t) => t.identifier === this.argv.template)
      if (!template) {
        throw new errors.BotpressCLIError(`No ${type} template found for identifier "${this.argv.template}"`)
      }
      return template
    }

    if (availableTemplates.length === 1) {
      this.logger.log(`Using default template: ${chalk.bold(availableTemplates[0].fullName)}`)
      return availableTemplates[0]
    }

    return await this._promptForTemplate(availableTemplates)
  }

  private async _promptForTemplate(
    availableTemplates: ProjectTemplates.TemplateArray
  ): Promise<ProjectTemplates.Template> {
    const templateIndex = await this.prompt.select<number>('Which template do you want to use?', {
      choices: availableTemplates.map((template, index) => ({
        title: template.fullName,
        value: index,
      })),
      default: 0,
    })

    if (templateIndex === undefined || templateIndex < 0 || templateIndex >= availableTemplates.length) {
      this.logger.log(`Using default template: ${chalk.bold(availableTemplates[0].fullName)}`)
      return availableTemplates[0]
    }

    return availableTemplates[templateIndex]!
  }

  private _getFullNameAndShortName(args: { workspaceHandle: string; name: string }) {
    const [workspaceOrName, projectName] = args.name.split('/', 2)
    const shortName = projectName ?? workspaceOrName!
    const fullName = `${args.workspaceHandle}/${shortName}`

    return { shortName, fullName }
  }

  private _initBot = async (args: { workDir: string }) => {
    const { workDir } = args
    const template = await this._getOrPromptForTemplate('bot')
    const name = await this._getName('bot', template.defaultProjectName)

    await this._copy({ srcDir: template.absolutePath, destDir: workDir, name, pkgJson: {} })
    this.logger.success(`Bot project initialized in ${chalk.bold(pathlib.join(workDir, name))}`)
  }

  private _initIntegration = async (args: { workDir: string; workspaceHandle: string }) => {
    const { workDir, workspaceHandle } = args
    const template = await this._getOrPromptForTemplate('integration')
    const name = await this._getName('integration', template.defaultProjectName)
    const { fullName, shortName } = this._getFullNameAndShortName({ workspaceHandle, name })

    await this._copy({
      srcDir: template.absolutePath,
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

    await fs.promises.cp(srcDir, destination, { recursive: true, filter: (src) => !src.includes('node_modules') })

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

    const workspace = await this._promptUserToSelectWorkspace()
    return workspace.handle || (await this._assignHandleToWorkspace(workspace))
  }

  private async _fetchWorkspaces(): Promise<void> {
    if (!this._isAuthenticated()) {
      return
    }

    const workspaces = await this._getClient()
      .client.list.workspaces({})
      .collect({})
      .catch((thrown) => {
        throw errors.BotpressCLIError.wrap(thrown, 'Unable to list your workspaces')
      })
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

  private async _promptUserToSelectWorkspace(): Promise<client.Workspace> {
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

    if (!workspaceId) {
      throw new errors.ParamRequiredError('Workspace')
    }

    return this._workspaces.find((ws) => ws.id === workspaceId)!
  }

  private async _assignHandleToWorkspace(workspace: client.Workspace): Promise<string> {
    this._logger.warn("It seems you don't have a workspace handle yet.")

    let claimedHandle: string | undefined

    do {
      const desiredHandle = await this._promptForDesiredHandle()
      const isAvailable = await this._checkHandleAvailability(desiredHandle)

      if (isAvailable) {
        claimedHandle = desiredHandle
        await this._updateWorkspaceWithHandle(workspace.id, claimedHandle)
      }
    } while (!claimedHandle)

    this._logger.success(`Handle "${claimedHandle}" is yours!`)
    return claimedHandle
  }

  private async _promptForDesiredHandle(): Promise<string> {
    const desiredHandle = await this._prompt.text('Please enter a workspace handle')

    if (!desiredHandle) {
      throw new errors.BotpressCLIError('Workspace handle is required')
    }

    return desiredHandle
  }

  private async _checkHandleAvailability(handle: string): Promise<boolean> {
    const { available, suggestions } = await this._getClient().client.checkHandleAvailability({ handle })

    if (!available) {
      this._logger.warn(`Handle "${handle}" is not available. Suggestions: ${suggestions.join(', ')}`)
      return false
    }

    return true
  }

  private async _updateWorkspaceWithHandle(workspaceId: string, handle: string): Promise<void> {
    try {
      await this._getClient().switchWorkspace(workspaceId).updateWorkspace({ handle })
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not claim handle "${handle}"`)
    }
  }

  private _getClient(): ApiClient {
    if (!this._client) {
      throw new errors.BotpressCLIError('Could not authenticate')
    }
    return this._client
  }
}
