import * as sdk from '@botpress/sdk'
import * as fslib from 'fs'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { BP_DEPENDENCIES_KEY, PKGJSON_FILE_NAME } from '../utils/pkgjson-utils'
import { ProjectCommand } from './project-command'

export type RemoveCommandDefinition = typeof commandDefinitions.remove
export class RemoveCommand extends ProjectCommand<RemoveCommandDefinition> {
  protected async run(): Promise<void> {
    const alias = this.argv.alias
    if (!alias) {
      throw new errors.BotpressCLIError('You have to provide the alias of the package to remove')
    }

    const workDir = utils.path.absoluteFrom(utils.path.cwd(), this.argv.workDir)

    const { validatedBpDeps, pkgJson } = await this._validatePkgJson(workDir)

    const correspondingPackageAlias = this._findCorrespondingPackage(alias, validatedBpDeps)

    await this._removeDepFromBpModules(correspondingPackageAlias, workDir, alias)

    await this._removeDepFromPkgJson(correspondingPackageAlias, validatedBpDeps, pkgJson, workDir, alias)
  }

  private async _validatePkgJson(workDir: string): Promise<{
    validatedBpDeps: Record<string, string>
    pkgJson: utils.pkgJson.PackageJson
  }> {
    const pkgJson = await utils.pkgJson.readPackageJson(workDir)
    if (!pkgJson) {
      throw new errors.BotpressCLIError(`No ${PKGJSON_FILE_NAME} found in path ${workDir}`)
    }

    const bpDependencies = pkgJson[BP_DEPENDENCIES_KEY]
    if (!bpDependencies) {
      throw new errors.BotpressCLIError('package')
    }

    const bpDependenciesSchema = sdk.z.record(sdk.z.string())
    const parseResult = bpDependenciesSchema.safeParse(bpDependencies)
    if (!parseResult.success) {
      throw new errors.BotpressCLIError(`Invalid ${BP_DEPENDENCIES_KEY} found in ${PKGJSON_FILE_NAME}`)
    }

    return { validatedBpDeps: parseResult.data, pkgJson }
  }

  private async _removeDepFromBpModules(
    correspondingPackageAlias: string,
    workDir: utils.path.AbsolutePath,
    alias: string
  ) {
    const packageDirName = utils.casing.to.kebabCase(correspondingPackageAlias)
    const installPath = utils.path.join(workDir, consts.installDirName, packageDirName)

    await fslib.promises.rm(installPath, { force: true, recursive: true })
    this.logger.log(`Package "${alias}" was removed from bp_modules`)
  }

  private async _removeDepFromPkgJson(
    correspondingPackageAlias: string,
    validatedBpDeps: Record<string, string>,
    pkgJson: utils.pkgJson.PackageJson,
    workDir: string,
    alias: string
  ) {
    const { [correspondingPackageAlias]: _, ...newBpDependencies } = validatedBpDeps
    pkgJson[BP_DEPENDENCIES_KEY] = newBpDependencies

    await utils.pkgJson.writePackageJson(workDir, pkgJson)
    this.logger.log(`Package with alias "${alias}" was removed from ${PKGJSON_FILE_NAME}`)
  }

  private _findCorrespondingPackage(alias: string, bpDependencies: Record<string, string>): string {
    const correspondingPackage: string | undefined = Object.keys(bpDependencies).find((key) => key === alias)

    if (!correspondingPackage) {
      throw new errors.BotpressCLIError(
        `No corresponding package for alias "${alias}" was found in ${BP_DEPENDENCIES_KEY}`
      )
    }

    return correspondingPackage
  }
}
