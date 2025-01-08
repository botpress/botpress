import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

const projectTypes = ['bot', 'integration', 'plugin'] as const
type ProjectType = (typeof projectTypes)[number]

type CopyProps = { srcDir: string; destDir: string; name: string; pkgJson: Record<string, unknown> }

export type InitCommandDefinition = typeof commandDefinitions.init
export class InitCommand extends GlobalCommand<InitCommandDefinition> {
  public async run(): Promise<void> {
    let { type: projectType } = this.argv

    if (!projectType) {
      const promptedType = await this.prompt.select('What type of project do you wish to initialize?', {
        choices: projectTypes.map((t) => ({ title: t, value: t })),
      })

      if (!promptedType) {
        throw new errors.ParamRequiredError('Project Type')
      }

      projectType = promptedType
    }

    const workDir = utils.path.absoluteFrom(utils.path.cwd(), this.argv.workDir)

    if (projectType === 'bot') {
      await this._initBot({ workDir })
      return
    }

    if (projectType === 'integration') {
      await this._initIntegration({ workDir })
      return
    }

    if (projectType === 'plugin') {
      await this._initPlugin({ workDir })
      return
    }

    type _assertion = utils.types.AssertNever<typeof projectType>
    throw new errors.BotpressCLIError(`Unknown project type: ${projectType}`)
  }

  private _initPlugin = async (args: { workDir: string }) => {
    const { workDir } = args
    const name = await this._getName('plugin', consts.emptyPluginDirName)
    await this._copy({
      srcDir: this.globalPaths.abs.emptyPluginTemplate,
      destDir: workDir,
      name,
      pkgJson: {
        pluginName: name,
      },
    })
    this.logger.success(`Plugin project initialized in ${chalk.bold(workDir)}`)
  }

  private _initBot = async (args: { workDir: string }) => {
    const { workDir } = args
    const name = await this._getName('bot', consts.emptyBotDirName)
    await this._copy({ srcDir: this.globalPaths.abs.emptyBotTemplate, destDir: workDir, name, pkgJson: {} })
    this.logger.success(`Bot project initialized in ${chalk.bold(workDir)}`)
  }

  private _initIntegration = async (args: { workDir: string }) => {
    const { workDir } = args

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

    await this._copy({
      srcDir: srcDirPath,
      destDir: workDir,
      name,
      pkgJson: {
        integrationName: name,
      },
    })
    this.logger.success(`Integration project initialized in ${chalk.bold(this.argv.workDir)}`)
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
