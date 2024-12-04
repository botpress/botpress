import _ from 'lodash'
import * as utils from '../../utils'
import * as consts from '../consts'
import * as mod from '../module'
import * as types from '../typings'

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

class LocalPluginModule extends mod.Module {
  private _implModule: ImplementationModule

  public constructor(private _pkg: Extract<types.PluginInstallablePackage, { source: 'local' }>) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

    this._implModule = new ImplementationModule(this._pkg.implementationCode)
    this.pushDep(this._implModule)
  }

  public async getContent(): Promise<string> {
    const implImport = this._implModule.import(this)

    const uri = utils.path.win32.escapeBackslashes(this._pkg.path)

    const definitionImport = utils.path.rmExtension(
      utils.path.join(this._pkg.path, consts.fromWorkDir.pluginDefinition)
    )

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import definition from "${definitionImport}"`,
      `import implementation from "./${implImport}"`,
      '',
      'export default {',
      '  type: "plugin",',
      `  uri: "${uri}",`,
      '  definition,',
      '  implementation,',
      '} satisfies sdk.PluginPackage',
    ].join('\n')
  }
}

class RemotePluginModule extends mod.Module {
  private _implModule: ImplementationModule

  public constructor(private _pkg: Extract<types.PluginInstallablePackage, { source: 'remote' }>) {
    super({
      path: consts.INDEX_FILE,
      exportName: consts.DEFAULT_EXPORT_NAME,
    })

    this._implModule = new ImplementationModule(this._pkg.plugin.code)
    this.pushDep(this._implModule)
  }

  public async getContent(): Promise<string> {
    const implImport = this._implModule.import(this)
    const definitionImport: string = './definition'

    return [
      consts.GENERATED_HEADER,
      'import * as sdk from "@botpress/sdk"',
      '',
      `import definition from "${definitionImport}"`,
      `import implementation from "${implImport}"`,
      '',
      'export default {',
      '  type: "plugin",',
      `  id: "${this._pkg.plugin.id}"`,
      '  definition,',
      '  implementation,',
      '} satisfies sdk.PluginPackage',
    ].join('\n')
  }
}

export const generatePluginPackage = async (pkg: types.PluginInstallablePackage): Promise<types.File[]> => {
  const module = pkg.source === 'local' ? new LocalPluginModule(pkg) : new RemotePluginModule(pkg)
  return module.flatten()
}
