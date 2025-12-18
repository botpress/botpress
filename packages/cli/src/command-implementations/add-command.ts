import * as sdk from '@botpress/sdk'
import * as fslib from 'fs'
import * as pathlib from 'path'
import semver from 'semver'
import * as apiUtils from '../api'
import * as codegen from '../code-generation'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as pkgRef from '../package-ref'
import * as utils from '../utils'
import { GlobalCommand } from './global-command'
import {
  ProjectCache,
  ProjectCommand,
  ProjectCommandDefinition,
  ProjectDefinitionLazy,
  ProjectDefinition,
} from './project-command'

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

type RefWithAlias = pkgRef.PackageRef & { alias?: string }

export type AddCommandDefinition = typeof commandDefinitions.add
export class AddCommand extends GlobalCommand<AddCommandDefinition> {
  public async run(): Promise<void> {
    const ref = this._parseArgvRef()
    if (ref) {
      return await this._addNewSinglePackage({ ...ref, alias: this.argv.alias })
    }

    const pkgJson = await utils.pkgJson.readPackageJson(this.argv.installPath).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Failed to read package.json file')
    })

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

    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    const modulesPath = utils.path.join(baseInstallPath, consts.installDirName)
    fslib.rmSync(modulesPath, { force: true, recursive: true })
    fslib.mkdirSync(modulesPath)

    for (const [pkgAlias, pkgRefStr] of Object.entries(parseResults.data)) {
      const parsed = pkgRef.parsePackageRef(pkgRefStr)
      if (!parsed) {
        throw new errors.InvalidPackageReferenceError(pkgRefStr)
      }

      const refWithAlias = { ...parsed, alias: pkgAlias }
      const foundPkg = await this._findPackage(refWithAlias)
      await this._addSinglePackage(refWithAlias, foundPkg)
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

    return parsed
  }

  private async _addSinglePackage(
    ref: RefWithAlias,
    props: { packageName: string; targetPackage: InstallablePackage }
  ) {
    const { packageName, targetPackage } = props

    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.installPath)
    const packageDirName = utils.casing.to.kebabCase(packageName)
    const installPath = utils.path.join(baseInstallPath, consts.installDirName, packageDirName)

    const alreadyInstalled = fslib.existsSync(installPath)
    if (alreadyInstalled) {
      await this._uninstall(installPath)
    }

    if (ref.type === 'name' && ref.version === pkgRef.LATEST_TAG) {
      // If the semver version expression is 'latest', we assume the project
      // is compatible with all versions of the latest major:
      const major = semver.major(targetPackage.pkg.version)
      targetPackage.pkg.version = `>=${major}.0.0 <${major + 1}.0.0`
    } else if (ref.type === 'name') {
      // Preserve the semver version expression in the generated code:
      targetPackage.pkg.version = ref.version
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
  private async _chooseNewAlias(existingPackages: Record<string, string>) {
    const setAliasConfirmation = await this.prompt.confirm(
      'Do you want to set an alias to the package you are installing?'
    )
    if (!setAliasConfirmation) {
      throw new errors.AbortedOperationError()
    }

    const alias = this._chooseUnusedAlias(existingPackages)

    return alias
  }

  private async _chooseUnusedAlias(existingPackages: Record<string, string>): Promise<string> {
    const alias = await this.prompt.text('Enter the new alias')
    const existingAlias = Object.entries(existingPackages).find(([dep, _]) => dep === alias)

    if (!alias) {
      throw new errors.BotpressCLIError('You cannot set an empty alias')
    }
    if (!existingAlias) {
      return alias
    }

    if (
      await this.prompt.confirm(
        `The alias ${alias} is already used for dependency ${existingAlias[1]}. Do you want to overwrite it?`
      )
    ) {
      return alias
    }
    return this._chooseUnusedAlias(existingPackages)
  }

  private async _addNewSinglePackage(ref: RefWithAlias) {
    const foundPackage = await this._findPackage(ref)
    const targetPackage = foundPackage.targetPackage
    const packageName = await this._addDependencyToPackage(foundPackage.packageName, targetPackage)
    await this._addSinglePackage(ref, { packageName, targetPackage })
  }

  private async _findPackage(ref: RefWithAlias): Promise<{ packageName: string; targetPackage: InstallablePackage }> {
    const targetPackage = ref.type === 'path' ? await this._findLocalPackage(ref) : await this._findRemotePackage(ref)
    if (!targetPackage) {
      const strRef = pkgRef.formatPackageRef(ref)
      throw new errors.BotpressCLIError(`Could not find package "${strRef}"`)
    }
    const packageName = ref.alias ?? targetPackage.pkg.name

    return { packageName, targetPackage }
  }

  private async _findRemotePackage(ref: pkgRef.ApiPackageRef): Promise<InstallablePackage | undefined> {
    const api = await this.ensureLoginAndCreateClient(this.argv)
    if (this._pkgCouldBe(ref, 'integration')) {
      const integration = await api.findPublicOrPrivateIntegration(ref)
      if (integration) {
        const { name, version } = integration
        return { type: 'integration', pkg: { integration, name, version } }
      }
    }
    if (this._pkgCouldBe(ref, 'interface')) {
      const intrface = await api.findPublicOrPrivateInterface(ref)
      if (intrface) {
        const { name, version } = intrface
        return { type: 'interface', pkg: { interface: intrface, name, version } }
      }
    }
    if (this._pkgCouldBe(ref, 'plugin')) {
      const plugin = await api.findPublicOrPrivatePlugin(ref)
      if (plugin) {
        const { code } = plugin.public
          ? await api.client.getPublicPluginCode({ id: plugin.id, platform: 'node' })
          : await api.client.getPluginCode({ id: plugin.id, platform: 'node' })
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

      const pluginDefinition = projectDefinition.definition
      const { name, version } = pluginDefinition
      const code = projectImplementation

      const createPluginReqBody = await apiUtils.prepareCreatePluginBody(pluginDefinition)
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
              interfaces: pluginDefinition.interfaces,
              integrations: pluginDefinition.integrations,
            },
            recurringEvents: pluginDefinition.recurringEvents,
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

    const { resolveProjectDefinition } = cmd.readProjectDefinitionFromFS()
    const definition = await resolveProjectDefinition().catch((thrown) => {
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

  private async _addDependencyToPackage(packageName: string, targetPackage: InstallablePackage): Promise<string> {
    const pkgJson = await utils.pkgJson.readPackageJson(this.argv.installPath).catch((thrown) => {
      throw errors.BotpressCLIError.wrap(thrown, 'Failed to read package.json file')
    })

    if (!pkgJson) {
      this.logger.warn('No package.json found in the install path')
      return packageName
    }

    const version =
      targetPackage.pkg.path ?? `${targetPackage.type}:${targetPackage.pkg.name}@${targetPackage.pkg.version}`
    const { bpDependencies } = pkgJson
    if (!bpDependencies) {
      pkgJson.bpDependencies = { [packageName]: version }
      await utils.pkgJson.writePackageJson(this.argv.installPath, pkgJson)
      return packageName
    }

    const bpDependenciesSchema = sdk.z.record(sdk.z.string())
    const parseResult = bpDependenciesSchema.safeParse(bpDependencies)
    if (!parseResult.success) {
      throw new errors.BotpressCLIError('Invalid bpDependencies found in package.json')
    }

    const { data: validatedBpDeps } = parseResult

    const alreadyPresentDep = Object.entries(validatedBpDeps).find(([key]) => key === packageName)
    if (alreadyPresentDep) {
      const alreadyPresentVersion = alreadyPresentDep[1]
      if (alreadyPresentVersion !== version) {
        this.logger.warn(
          `The dependency with alias ${packageName} is already present in the bpDependencies of package.json, but with version ${alreadyPresentVersion}.`
        )
        const res = await this.prompt.confirm(`Do you want to overwrite the dependency with version ${version}?`)
        if (!res) {
          const newAlias = await this._chooseNewAlias(validatedBpDeps)
          packageName = newAlias
        }
      }
    }

    pkgJson.bpDependencies = {
      ...validatedBpDeps,
      [packageName]: version,
    }

    await utils.pkgJson.writePackageJson(this.argv.installPath, pkgJson)
    return packageName
  }
}

// this is a hack to avoid refactoring the project command class
class _AnyProjectCommand extends ProjectCommand<ProjectCommandDefinition> {
  public async run(): Promise<void> {
    throw new errors.BotpressCLIError('Not implemented')
  }

  public readProjectDefinitionFromFS(): ProjectDefinitionLazy {
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
