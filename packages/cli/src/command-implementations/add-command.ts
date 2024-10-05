import * as fslib from 'fs'
import * as pathlib from 'path'
import * as apiUtils from '../api'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as pkgRef from '../package-ref'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'

type InstallablePackage =
  | {
      type: 'integration'
      name: string
      integration: apiUtils.Integration
    }
  | {
      type: 'interface'
      name: string
      interface: apiUtils.Interface
    }

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends GlobalCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    const parsedRef = pkgRef.parsePackageRef(this.argv.integrationRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.integrationRef)
    }

    const targetPackage =
      parsedRef.type === 'path'
        ? await this._findLocalPackage(parsedRef)
        : await this._findRemotePackage(api, parsedRef)

    if (!targetPackage) {
      throw new errors.BotpressCLIError(`Package "${this.argv.integrationRef}" not found`)
    }

    const packageName = targetPackage.name // TODO: eventually replace name by alias (with argv --alias)
    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    const installPath = utils.path.join(baseInstallPath, consts.installDirName, packageName)

    const alreadyInstalled = fslib.existsSync(installPath)
    if (alreadyInstalled) {
      this.logger.warn(`Package with name "${packageName}" already installed.`)
      const res = await this.prompt.confirm('Do you want to overwrite the existing package?')
      if (!res) {
        this.logger.log('Aborted')
        return
      }

      await this._uninstall(installPath)
    }

    let files: codegen.File[]
    if (targetPackage.type === 'integration') {
      const { integration } = targetPackage
      files = await codegen.generateIntegrationPackage(integration)
    } else {
      const { interface: intrface } = targetPackage
      files = await codegen.generateInterfacePackage(intrface)
    }

    await this._install(installPath, files)
  }

  private async _findRemotePackage(
    api: apiUtils.ApiClient,
    ref: pkgRef.ApiPackageRef
  ): Promise<InstallablePackage | undefined> {
    const integration = await api.findIntegration(ref)
    if (integration) {
      return { type: 'integration', integration, name: integration.name }
    }
    const intrface = await api.findPublicInterface(ref)
    if (intrface) {
      return { type: 'interface', interface: intrface, name: intrface.name }
    }
    return
  }

  private async _findLocalPackage(_ref: pkgRef.LocalPackageRef): Promise<InstallablePackage | undefined> {
    throw new errors.BotpressCLIError('Cannot install local packages yet')
  }

  private async _install(installPath: utils.path.AbsolutePath, files: codegen.File[]): Promise<void> {
    const line = this.logger.line()
    line.started(`Installing ${files.length} files to "${installPath}"`)
    try {
      for (const file of files) {
        const filePath = utils.path.absoluteFrom(installPath, file.path)
        const dirPath = pathlib.dirname(filePath)
        await fslib.promises.mkdir(dirPath, { recursive: true })
        await fslib.promises.writeFile(filePath, file.content)
      }
      line.success(`Installed ${files.length} files to "${installPath}"`)
    } finally {
      line.commit()
    }
  }

  private async _uninstall(installPath: utils.path.AbsolutePath): Promise<void> {
    await fslib.promises.rm(installPath, { recursive: true })
  }
}
