import _ from 'lodash'
import * as consts from '../consts'
import * as gen from '../generators'
import * as mod from '../module'
import * as types from '../typings'
import { PluginPackageDefinitionModule } from './plugin-package-definition'

class ImplementationModule extends mod.Module {
  public constructor(private _implementationCode: string) {
    super({
      path: 'implementation.ts',
      exportName: 'default',
    })
  }

  public async getContent(): Promise<string> {
    const base64Str = Buffer.from(this._implementationCode).toString('base64')
    const chunks: string[] = _.chunk(base64Str, 80).map((chunk) => chunk.join(''))

    return [
      //
      'export default Buffer.from([',
      ...chunks.map((chunk) => `  "${chunk}",`),
      '].join(""), "base64")',
    ].join('\n')
  }
}

class PluginModule extends mod.Module {
  private _implModule: ImplementationModule
  private _defModule: PluginPackageDefinitionModule

  public constructor(private _pkg: types.PluginInstallablePackage) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

    this._implModule = new ImplementationModule(this._pkg.code)
    this.pushDep(this._implModule)

    this._defModule = new PluginPackageDefinitionModule(this._pkg.plugin)
    this._defModule.unshift('definition')
    this.pushDep(this._defModule)
  }

  public async getContent(): Promise<string> {
    const implImport = this._implModule.import(this)
    const defImport = this._defModule.import(this)

    const id = this._pkg.plugin.id
    const uri = this._pkg.path

    const tsId = gen.primitiveToTypescriptValue(id)
    const tsUri = gen.primitiveToTypescriptValue(uri)
    const tsName = gen.primitiveToTypescriptValue(this._pkg.name)
    const tsVersion = gen.primitiveToTypescriptValue(this._pkg.version)

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import definition from "./${defImport}"`,
      `import implementation from "./${implImport}"`,
      '',
      'export default {',
      '  type: "plugin",',
      `  id: ${tsId},`,
      `  uri: ${tsUri},`,
      `  name: ${tsName},`,
      `  version: ${tsVersion},`,
      '  definition,',
      '  implementation,',
      '} satisfies sdk.PluginPackage',
    ].join('\n')
  }
}

export const generatePluginPackage = async (pkg: types.PluginInstallablePackage): Promise<types.File[]> => {
  const module = new PluginModule(pkg)
  return module.flatten()
}
