import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

type ProjectType = 'bot' | 'integration'

export type InitCommandDefinition = typeof commandDefinitions.init
export class InitCommand extends GlobalCommand<InitCommandDefinition> {
  public async run(): Promise<void> {
    let { type: projectType } = this.argv

    if (!projectType) {
      const promptedType = await this.prompt.select('What type of project do you wish to initialize?', {
        choices: (['bot', 'integration'] as const).map((t) => ({ title: t, value: t })),
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

    await this._initIntegration({ workDir })
    return
  }

  private _initBot = async (args: { workDir: string }) => {
    const { workDir } = args
    const name = await this._getName('bot', consts.echoBotDirName)
    await this._copy({ srcDir: this.globalPaths.abs.echoBotTemplate, destDir: workDir, name })
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

    await this._copy({ srcDir: srcDirPath, destDir: workDir, name })
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

  private _copy = async (props: { srcDir: string; destDir: string; name: string }) => {
    const { srcDir, destDir, name } = props

    const dirName = utils.casing.to.kebabCase(name)
    const destination = pathlib.join(destDir, dirName)

    const exist = await this._checkIfDestinationExists(destination)
    if (exist) {
      return
    }

    await fs.promises.cp(srcDir, destination, { recursive: true })

    const pkgJsonPath = pathlib.join(destination, 'package.json')
    const strContent = await fs.promises.readFile(pkgJsonPath, 'utf-8')
    const { name: _, integrationName: __, ...json } = JSON.parse(strContent)

    const pkgJsonName = utils.casing.to.snakeCase(name)
    const updatedJson = { name: pkgJsonName, integrationName: name, ...json }
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
