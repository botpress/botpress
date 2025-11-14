import * as sdk from '@botpress/sdk'
import * as fslib from 'fs'
import type commandDefinitions from '../command-definitions'
import * as consts from '../consts'
import * as errors from '../errors'
import * as utils from '../utils'
import { ProjectCommand } from './project-command'

export type RemoveCommandDefinition = typeof commandDefinitions.remove
export class RemoveCommand extends ProjectCommand<RemoveCommandDefinition> {
  protected async run(): Promise<void> {
    const ref = this.argv.alias
    if (!ref) {
      throw new errors.BotpressCLIError('You have to provide the alias of the package to remove')
    }

    const baseInstallPath = utils.path.absoluteFrom(utils.path.cwd(), this.argv.workDir)
    //remove from package.json
    const pkgJson = await utils.pkgJson.readPackageJson(baseInstallPath)
    if (!pkgJson) {
      throw new errors.BotpressCLIError(`No package.json found in path ${baseInstallPath}`)
    }

    const { bpDependencies } = pkgJson
    if (!bpDependencies) {
      throw new errors.BotpressCLIError('package')
    }

    const bpDependenciesSchema = sdk.z.record(sdk.z.string())
    const parseResult = bpDependenciesSchema.safeParse(bpDependencies)
    if (!parseResult.success) {
      throw new errors.BotpressCLIError('Invalid bpDependencies found in package.json')
    }

    const { data: validatedBpDeps } = parseResult

    const correspondingPackageAlias = this._findCorrespondingPackage(ref, validatedBpDeps)

    //remove from bp_modules
    const packageDirName = utils.casing.to.kebabCase(correspondingPackageAlias)
    const installPath = utils.path.join(baseInstallPath, consts.installDirName, packageDirName)
    fslib.rmSync(installPath, { force: true, recursive: true })

    //rewrite package.json
    const { [correspondingPackageAlias]: _, ...newBpDependencies } = validatedBpDeps
    pkgJson.bpDependencies = newBpDependencies

    await utils.pkgJson.writePackageJson(baseInstallPath, pkgJson)
  }

  private _findCorrespondingPackage(alias: string, bpDependencies: Record<string, string>): string {
    const correspondingPackage: string | undefined = Object.keys(bpDependencies).find((key) => key === alias)

    if (!correspondingPackage) {
      throw new errors.BotpressCLIError(`No corresponding package for alias ${alias} was found`)
    }

    return correspondingPackage
  }
}
