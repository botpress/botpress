import * as fslib from 'fs'
import * as pathlib from 'path'
import { ApiClient } from '../api'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as pkgRef from '../package-ref'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'
import { ProjectCommand, ProjectCommandDefinition, ProjectDefinition } from './project-command'

type InstallablePackage =
  | {
      type: 'integration'
      name: string
      pkg: codegen.IntegrationInstallablePackage
    }
  | {
      type: 'interface'
      name: string
      pkg: codegen.InterfaceInstallablePackage
    }

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends GlobalCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const parsedRef = pkgRef.parsePackageRef(this.argv.packageRef)
    if (!parsedRef) {
      throw new errors.InvalidPackageReferenceError(this.argv.packageRef)
    }

    const targetPackage =
      parsedRef.type === 'path' ? await this._findLocalPackage(parsedRef) : await this._findRemotePackage(parsedRef)

    if (!targetPackage) {
      const notFoundMessage = this.argv.packageType
        ? `Could not find package "${this.argv.packageRef}" of type "${this.argv.packageType}"`
        : `Could not find package "${this.argv.packageRef}"`
      throw new errors.BotpressCLIError(notFoundMessage)
    }

    const packageName = targetPackage.name // TODO: eventually replace name by alias (with argv --alias)
    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    const packageDirName = utils.casing.to.kebabCase(packageName)
    const installPath = utils.path.join(baseInstallPath, consts.installDirName, packageDirName)

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
      files = await codegen.generateIntegrationPackage(targetPackage.pkg)
    } else {
      files = await codegen.generateInterfacePackage(targetPackage.pkg)
    }

    await this._install(installPath, files)
  }

  private async _findRemotePackage(ref: pkgRef.ApiPackageRef): Promise<InstallablePackage | undefined> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    if (this._pkgCouldBe('integration')) {
      const integration = await api.findIntegration(ref)
      if (integration) {
        const interfaces = await api.fetchIntegrationInterfaces(integration)
        return { type: 'integration', name: integration.name, pkg: { source: 'remote', integration, interfaces } }
      }
    }
    if (this._pkgCouldBe('interface')) {
      const intrface = await api.findPublicInterface(ref)
      if (intrface) {
        return { type: 'interface', name: intrface.name, pkg: { source: 'remote', interface: intrface } }
      }
    }
    return
  }

  private async _findLocalPackage(ref: pkgRef.LocalPackageRef): Promise<InstallablePackage | undefined> {
    const absPath = utils.path.absoluteFrom(utils.path.cwd(), ref.path)
    const projectDefinition = await this._readProject(absPath)
    if (this._pkgCouldBe('integration') && projectDefinition?.type === 'integration') {
      return {
        type: 'integration',
        name: projectDefinition.definition.name,
        pkg: { source: 'local', path: absPath },
      }
    }
    if (this._pkgCouldBe('interface') && projectDefinition?.type === 'interface') {
      return {
        type: 'interface',
        name: projectDefinition.definition.name,
        pkg: { source: 'local', path: absPath },
      }
    }
    if (projectDefinition?.type === 'bot') {
      throw new errors.BotpressCLIError('Cannot install a bot as a package')
    }
    return
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

  private async _readProject(workDir: utils.path.AbsolutePath): Promise<ProjectDefinition | undefined> {
    // this is a hack to avoid refactoring the project command class
    class AnyProjectCommand extends ProjectCommand<ProjectCommandDefinition> {
      public async run(): Promise<void> {
        throw new errors.BotpressCLIError('Not implemented')
      }

      public async readProjectDefinitionFromFS(): Promise<ProjectDefinition> {
        return super.readProjectDefinitionFromFS()
      }
    }

    const cmd = new AnyProjectCommand(ApiClient, this.prompt, this.logger, {
      ...this.argv,
      workDir,
    })

    return cmd.readProjectDefinitionFromFS().catch((thrown) => {
      if (thrown instanceof errors.ProjectDefinitionNotFoundError) {
        return undefined
      }
      throw thrown
    })
  }

  private _pkgCouldBe = (pkgType: InstallablePackage['type']) => {
    if (!this.argv.packageType) {
      return true
    }
    return this.argv.packageType === pkgType
  }
}
