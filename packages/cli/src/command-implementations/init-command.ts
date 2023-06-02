import chalk from 'chalk'
import * as fs from 'fs'
import * as pathlib from 'path'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

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

    let name = this.argv.name
    if (!name) {
      const defaultName = projectType === 'bot' ? consts.echoBotDirName : consts.emptyIntegrationDirName
      const promptMessage = `What is the name of your ${projectType}?`
      const promptedName = await this.prompt.text(promptMessage, { initial: defaultName })
      if (!promptedName) {
        throw new errors.ParamRequiredError('Project Name')
      }
      name = promptedName
    }

    const workDir = utils.path.absoluteFrom(utils.path.cwd(), this.argv.workDir)

    if (projectType === 'bot') {
      await this._copy({ srcDir: this.globalPaths.abs.echoBotTemplate, destDir: workDir, name })
      this.logger.success(`Bot project initialized in ${chalk.bold(workDir)}`)
      return
    }

    await this._copy({ srcDir: this.globalPaths.abs.emptyIntegrationTemplate, destDir: workDir, name })
    this.logger.success(`Integration project initialized in ${chalk.bold(this.argv.workDir)}`)
    return
  }

  private _copy = async (props: { srcDir: string; destDir: string; name: string }) => {
    const { srcDir, destDir, name } = props
    const destination = pathlib.join(destDir, props.name)

    const exist = await this._checkIfDestinationExists(destination)
    if (exist) {
      return
    }

    await fs.promises.cp(srcDir, destination, { recursive: true })

    const pkgJsonPath = pathlib.join(destination, 'package.json')
    const strContent = await fs.promises.readFile(pkgJsonPath, 'utf-8')
    const { name: _, ...json } = JSON.parse(strContent)

    const pkgJsonName = utils.casing.to.snakeCase(name)
    const updatedJson = { name: pkgJsonName, ...json }
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
