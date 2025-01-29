import * as sdk from '@botpress/sdk'
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
import { ProjectCache, ProjectCommand, ProjectCommandDefinition, ProjectDefinition } from './project-command'

type InstallablePackage =
  | {
      type: 'integration'
      pkg: codegen.IntegrationInstallablePackage
    }
  | {
      type: 'interface'
      pkg: codegen.InterfaceInstallablePackage
    }
  | {
      type: 'plugin'
      pkg: codegen.PluginInstallablePackage
    }

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends GlobalCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const ref = this._parseArgvRef()
    if (ref) {
      return await this._addSinglePackage(ref)
    }

    const pkgJson = await utils.pkgJson.readPackageJson(this.argv.installPath)
    if (!pkgJson) {
      this.logger.warn('No package.json found in the install path')
      return
    }

    const { bpDependencies } = pkgJson
    if (!bpDependencies) {
      this.logger.log('No bp dependencies found in package.json')
      return
    }

    const bpDependenciesSchema = sdk.z.record(sdk.z.string())
    const parseResults = bpDependenciesSchema.safeParse(bpDependencies)
    if (!parseResults.success) {
      throw new errors.BotpressCLIError('Invalid bpDependencies found in package.json')
    }

    for (const [pkgAlias, pkgRefStr] of Object.entries(parseResults.data)) {
      const parsed = pkgRef.parsePackageRef(pkgRefStr)
      if (!parsed) {
        throw new errors.InvalidPackageReferenceError(pkgRefStr)
      }

      await this._addSinglePackage({ ...parsed, alias: pkgAlias })
    }
  }

  private _parseArgvRef = (): pkgRef.PackageRef | undefined => {
    if (!this.argv.packageRef) {
      return
    }

    const parsed = pkgRef.parsePackageRef(this.argv.packageRef)
    if (!parsed) {
      throw new errors.InvalidPackageReferenceError(this.argv.packageRef)
    }

    if (parsed.type !== 'name') {
      return parsed
    }

    const argvPkgType = this.argv.packageType
    if (!argvPkgType) {
      return parsed
    }

    const ref = { ...parsed, pkg: argvPkgType }

    const strRef = pkgRef.formatPackageRef(ref)
    this.logger.warn(`argument --packageType is deprecated; please use the package reference format "${strRef}"`)

    return ref
  }

  private async _addSinglePackage(ref: pkgRef.PackageRef & { alias?: string }): Promise<void> {
    const targetPackage = ref.type === 'path' ? await this._findLocalPackage(ref) : await this._findRemotePackage(ref)

    if (!targetPackage) {
      const strRef = pkgRef.formatPackageRef(ref)
      throw new errors.BotpressCLIError(`Could not find package "${strRef}"`)
    }

    const packageName = ref.alias ?? targetPackage.pkg.name
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
    } else if (targetPackage.type === 'interface') {
      files = await codegen.generateInterfacePackage(targetPackage.pkg)
    } else if (targetPackage.type === 'plugin') {
      files = await codegen.generatePluginPackage(targetPackage.pkg)
    } else {
      type _assertion = utils.types.AssertNever<typeof targetPackage>
      throw new errors.BotpressCLIError('Invalid package type')
    }

    await this._install(installPath, files)
  }

  private async _findRemotePackage(ref: pkgRef.ApiPackageRef): Promise<InstallablePackage | undefined> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    if (this._pkgCouldBe(ref, 'integration')) {
      const integration = await api.findIntegration(ref)
      if (integration) {
        const { name, version } = integration
        return { type: 'integration', pkg: { integration, name, version } }
      }
    }
    if (this._pkgCouldBe(ref, 'interface')) {
      const intrface = await api.findPublicInterface(ref)
      if (intrface) {
        const { name, version } = intrface
        return { type: 'interface', pkg: { interface: intrface, name, version } }
      }
    }
    if (this._pkgCouldBe(ref, 'plugin')) {
      const plugin = await api.findPublicPlugin(ref)
      if (plugin) {
        const { code } = await api.client.getPluginCode({ id: plugin.id, platform: 'node' })
        const { name, version } = plugin
        return {
          type: 'plugin',
          pkg: {
            name,
            version,
            plugin,
            code,
          },
        }
      }
    }
    return
  }

  private async _findLocalPackage(ref: pkgRef.LocalPackageRef): Promise<InstallablePackage | undefined> {
    const absPath = utils.path.absoluteFrom(utils.path.cwd(), ref.path)
    const {
      definition: projectDefinition,
      implementation: projectImplementation,
      devId: projectDevId,
    } = await this._readProject(absPath)

    if (projectDefinition?.type === 'integration') {
      const { name, version } = projectDefinition.definition
      let devId: string | undefined
      if (this.argv.useDev && projectDevId) {
        this.logger.warn(`Installing integration "${name}" with dev version "${projectDevId}"`)
        devId = projectDevId
      }

      let createIntegrationReqBody = await this._getProjectCmd(ref.path).prepareCreateIntegrationBody(
        projectDefinition.definition
      )
      createIntegrationReqBody = {
        ...createIntegrationReqBody,
        interfaces: utils.records.mapValues(projectDefinition.definition.interfaces ?? {}, (i) => ({
          id: '', // TODO: do this better
          ...i,
        })),
      }
      return {
        type: 'integration',
        pkg: { path: absPath, devId, name, version, integration: createIntegrationReqBody },
      }
    }

    if (projectDefinition?.type === 'interface') {
      const { name, version } = projectDefinition.definition
      const createInterfaceReqBody = await apiUtils.prepareCreateInterfaceBody(projectDefinition.definition)
      return {
        type: 'interface',
        pkg: { path: absPath, name, version, interface: createInterfaceReqBody },
      }
    }

    if (projectDefinition?.type === 'plugin') {
      if (!projectImplementation) {
        throw new errors.BotpressCLIError(
          'Plugin implementation not found; Please build the plugin project before installing'
        )
      }

      const { name, version } = projectDefinition.definition
      const code = projectImplementation

      const createPluginReqBody = await apiUtils.prepareCreatePluginBody(projectDefinition.definition)
      return {
        type: 'plugin',
        pkg: {
          path: absPath,
          name,
          version,
          code,
          plugin: {
            ...createPluginReqBody,
            dependencies: {
              interfaces: await utils.promises.awaitRecord(
                utils.records.mapValues(
                  projectDefinition.definition.interfaces ?? {},
                  apiUtils.prepareCreateInterfaceBody
                )
              ),
              integrations: await utils.promises.awaitRecord(
                utils.records.mapValues(
                  projectDefinition.definition.integrations ?? {},
                  apiUtils.prepareCreateIntegrationBody
                )
              ),
            },
          },
        },
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

  private async _readProject(workDir: utils.path.AbsolutePath): Promise<{
    definition?: ProjectDefinition
    implementation?: string
    devId?: string
  }> {
    const cmd = this._getProjectCmd(workDir)

    const definition = await cmd.readProjectDefinitionFromFS().catch((thrown) => {
      if (thrown instanceof errors.ProjectDefinitionNotFoundError) {
        return undefined
      }
      throw thrown
    })

    const devId = await cmd.projectCache.get('devId')

    const implementationAbsPath = utils.path.join(workDir, consts.fromWorkDir.outFileCJS)
    if (!fslib.existsSync(implementationAbsPath)) {
      return { definition, devId }
    }

    const implementation = await fslib.promises.readFile(implementationAbsPath, 'utf8')
    return { definition, implementation, devId }
  }

  private _pkgCouldBe = (ref: pkgRef.ApiPackageRef, pkgType: InstallablePackage['type']) => {
    if (ref.type === 'id') {
      // TODO: use ULID prefixes to determine the type of the package
      return true
    }
    if (!ref.pkg) {
      return true // ref does not specify the package type
    }
    return ref.pkg === pkgType
  }

  private _getProjectCmd(workDir: string): _AnyProjectCommand {
    return new _AnyProjectCommand(apiUtils.ApiClient, this.prompt, this.logger, {
      ...this.argv,
      workDir,
    })
  }
}

// this is a hack to avoid refactoring the project command class
class _AnyProjectCommand extends ProjectCommand<ProjectCommandDefinition> {
  public async run(): Promise<void> {
    throw new errors.BotpressCLIError('Not implemented')
  }

  public async readProjectDefinitionFromFS(): Promise<ProjectDefinition> {
    return super.readProjectDefinitionFromFS()
  }

  public async prepareCreateIntegrationBody(
    integrationDef: sdk.IntegrationDefinition
  ): Promise<apiUtils.CreateIntegrationRequestBody> {
    return super.prepareCreateIntegrationBody(integrationDef)
  }

  public get projectCache(): utils.cache.FSKeyValueCache<ProjectCache> {
    return super.projectCache
  }
}
